#coding:cp932
"""
UnicodeDecodeError: 'utf-8' codec can't decode byte 0x93 in position 0: invalid start byte
のエラーにならないように、フォルダパスは英語にする

[データベース構造]
C:\arcgisserver\public\
  challenge_db.gdb
    |- NADATASET
       |- NADATASET_ND
       |- NADATASET_ND_Junctions
       |- Railroads_Metro     ---軌道路線（メトロ）
       |- Stations_Metro      ---駅（メトロ）_PT
       |- station_metro_view  ---駅（メトロ）

    |- Delay_RailRoad_Metro  ---軌道路線（メトロ）_遅延
    |- Delay_Station_Metro   ---駅（メトロ）_遅延
    |- KANTO_PREF            ---都道府県（関東）
    |- RailRoadSection       ---軌道路線
    |- Station               ---駅

train.csv                  ---現在取得した処理用のCSVファイル
"""
import sys
import os
import arcpy
import datetime
import time
import urllib
import json
import csv
import codecs
import shutil
import logging

# 取得ファイルの時間文字列
filedatestr = 'def'

"""
共通の処理
"""
def getTimeString(dcdate_val):
    # dc:date
    # "2018-02-28T00:31:48+09:00"から次を作成
    # '2018-02-28 00:31:48'
    return "'{0} {1}'".format(dcdate_val[:10], dcdate_val[11:19])

def printStartMessage(fname,t):
    logging.debug("--Start :{0} --,{1}".format(fname,t))
    #print("--Start :{0} --,{1}".format(fname,t))
def printFinishMessage(fname,t):
    logging.debug("--Finish:{0} --,{1}".format(fname,t))
    #print("--Finish:{0} --,{1}".format(fname,t))
def printElapsedMessage(fname,t):
    logging.debug("  Elapsed time:{0} ,{1}".format(fname,t))
    #print("  Elapsed time:{0} ,{1}".format(fname,t))
def printMessage(msg):
    logging.debug("{0}".format(msg))
    #print("{0}".format(msg))

def setupSearchRailway():

    #
    # fgdbの場合
    ws = r"C:\arcgisserver\publish\challenge_db.gdb"
    fcdatasetname = "NADATASET"

    # 公共交通のAPIから取得して保存するファイル
    train_csv_name = "train.csv"

    # 0.出力ログ設定
    setlogger(ws)

    # 1.APIから取得してcsvファイルへの保存処理
    getopendata(ws)

    # 2.csvファイルをもとにDelay_xxxxを最新化する処理
    getTrainLocations(ws, fcdatasetname, train_csv_name)



def getTrainLocations(gdbws, fcdatasetname, trainTableName):
    """
    公共交通APIの列車ロケーションから変換済みのCSVをもとに
    列車ロケーション情報を取得しDelay_Railroad_Metro, Delay_Station_Metro を最新化
    第1引数：challenge_db.gdb　へのフルパス
    第2引数：フィーチャデータセット名
    第3引数：現在の列車遅延csvファイル
    """
    logging.debug('--arcgis processing:getTrainLocations')

    # Network Analystのライセンスをチェックアウト
    arcpy.CheckOutExtension("Network")

    # Tips! バッチ処理など繰り返しするだんだん速度低下するのでログをオフに
    arcpy.SetLogHistory(False)

    train_ws = os.path.dirname(gdbws)
    arcpy.env.workspace = train_ws

    # 抽出する路線名
    operator_name = 'odpt.Operator:TokyoMetro'

    # 抽出する対象の遅れ時間
    delayTime = 0

    # 動作確認用
    #q_wh ="odpt_delay >= 0 AND odpt_operator = 'odpt.Operator:TokyoMetro' AND odpt_tostation IS NOT NULL AND odpt_fromstation IS NOT NULL"
    #q_wh = "odpt_delay >= {0} AND odpt_operator = '{1}' AND odpt_tostation IS NOT NULL AND odpt_fromstation IS NOT NULL".format(delayTime, operator_name)


    # 本番用(FromStation と ToStationが入っている場合)
    q_wh = "odpt_delay > {0} AND odpt_operator = '{1}' AND odpt_tostation IS NOT NULL AND odpt_fromstation IS NOT NULL".format(delayTime, operator_name)
    #print q_wh

    fields = ['dc_date','odpt_delay','odpt_railway','odpt_fromstation','odpt_tostation','odpt_operator','odpt_trainnumber']

    try:

        with arcpy.da.SearchCursor(trainTableName, fields, q_wh) as cursor:
            # バッチ処理高速化-ネットワーク解析を行なう関数側にRecordSetを渡すようにした
            trainLocationAnalBatch(gdbws, fcdatasetname, cursor)


    except arcpy.ExecuteError as e:
        # GP エラー
        logging.debug(str(e).decode('utf-8'))
        #print str(e).decode('utf-8')
    except Exception as e:
        # Python エラー
        logging.debug(str(e).decode('utf-8'))
        #print str(e).decode('utf-8')
    finally:
        # ファイルの後始末
        arcpy.Delete_management(trainTableName)


def trainLocationAnalBatch(inws, fcdatasetname, tableRows):

    # 開始メッセージ
    funcname = "trainLocationAnalBatch"
    start = datetime.datetime.now()
    printStartMessage(funcname,start)

    # NADATASETはFeatureDataset内
    ws = os.path.join(inws, fcdatasetname)
    arcpy.env.workspace = ws

    inNetworkDataset_name = "NADATASET_ND"
    inNetworkDataset = os.path.join(ws, inNetworkDataset_name)
    #outNALayerName = "Route"
    outNALayerName = u"Route"
    impedanceAttribute = u"長さ"

    # フィーチャクラス名(FeatureDataset内)
    staion_fc_name = "Station_Metro"
    railroad_fc_name = "Railroad_Metro"
    station_fc = os.path.join(ws, staion_fc_name)
    railroad_fc = os.path.join(ws, railroad_fc_name)

    # 遅延フィーチャクラス名
    delay_station_fc_name = "Delay_Station_Metro"
    delay_railroad_fc_name = "Delay_Railroad_Metro"
    delay_station_fc  = os.path.join(os.path.dirname(ws), delay_station_fc_name)
    delay_railroad_fc = os.path.join(os.path.dirname(ws), delay_railroad_fc_name)

    try:

        # Delay_stationとDelay_Railroadのレコード削除
        # 2018.3.8: 既存フィーチャクラスがない場合にも対応
        if arcpy.Exists(delay_station_fc):
            arcpy.TruncateTable_management(delay_station_fc)
        if arcpy.Exists(delay_railroad_fc):
            arcpy.TruncateTable_management(delay_railroad_fc)

        #
        #print("Start select delay train")
        logging.debug(" 1) MakeRouteLayer -StartLoop-")
        #print(" 1) MakeRouteLayer -StartLoop-")
        #outNALayer = arcpy.na.MakeRouteLayer(inNetworkDataset, outNALayerName, impedanceAttribute)
        # Get the layer object from the result object
        #naClasses = arcpy.na.GetNAClassNames(outNALayer.getOutput(0))
        # 2018.3.8: outNALayerとnaClassesをここで取得するように修正
        outNALayer = arcpy.na.MakeRouteLayer(inNetworkDataset, outNALayerName, impedanceAttribute).getOutput(0)
        naClasses = arcpy.na.GetNAClassNames(outNALayer)


        # レコード数が0件なら何もしない
        # これエラーになる。。。
        #if int(arcpy.GetCount_management(tableRows).getOutput(0)) < 1:
        #    return

        cnt = 0
        updatetime = ""

        for row in tableRows:
            if cnt == 0:
                updatetime = getTimeString(row[0]) #秒単位でバラつきがあるのでレコード時間とする
            delaytime = row[1]
            railway_name = row[2]
            from_sta_name = row[3]
            to_sta_name = row[4]
            cnt = cnt + 1

            printMessage("{0}  件目 From:{1}  To:{2}".format(cnt, from_sta_name, to_sta_name))
            # x) ○○線のFrom駅とTo駅のポイントを"stop_sta"レイヤとして抽出
            #print(" 2) MakeFeatureLayer")
            sta_wh = "railway_sameas = '{0}' AND (station_sameas = '{1}' OR station_sameas = '{2}')".format(railway_name,from_sta_name,to_sta_name)
            arcpy.MakeFeatureLayer_management(station_fc, "stop_sta", sta_wh)
            #print arcpy.GetCount_management("stop_sta")
            if int(arcpy.GetCount_management("stop_sta").getOutput(0)) != 2:
                continue

            # x) fieldmappingの機能でNameとRouteNameの属性は入れることは可能
            # 先:Name - 元:station_sameas
            # 先:RouteName - 元:railway_sameas
            #print(" 3) FieldsMapping")
            station_fields = arcpy.ListFields(station_fc)
            stopsFieldMappings = arcpy.na.NAClassFieldMappings(outNALayer, naClasses[u'Stops'], False, station_fields)
            stopFieldMap1 = stopsFieldMappings[u"Name"]
            stopFieldMap1.mappedFieldName = "station_sameas"
            stopFieldMap2 = stopsFieldMappings[u"RouteName"]
            stopFieldMap2.mappedFieldName = "railway_sameas"


            # x) 抽出したFrom駅とTo駅をNALayerにStopsとして追加
            #print(" 4) AddLocations")
            # 言語設定によって異なる:locale-jp
            #arcpy.na.AddLocations(outNALayer,"ストップ", "stop_sta", stopsFieldMappings, "")
            # 言語設定によって異なる:locale-en
            #arcpy.na.AddLocations(outNALayer, "Stops", "stop_sta", stopsFieldMappings, "")
            # 2018.3.8: 言語設定で関係ないようnaClassesから取得するように修正
            arcpy.na.AddLocations(outNALayer, naClasses[u'Stops'], "stop_sta", stopsFieldMappings, "")

            # x) 解析の実行（このときのNameにテーブル結合できるものを指定できれば）
            #print(" 5) Solve")
            arcpy.na.Solve(outNALayer)

            # x) 処理結果の"Route/Routes"のラインを保存
            logging.debug(" 6) Get Routes")
            #print(" 6) Get Routes")
            # u'Route/Routes'の形式でないと次の処理できない
            #route_solved = u'{0}\{1}'.format(u"Route",arcpy.na.GetNAClassNames(outNALayer)['Routes'])
            # 2018.3.8: スタンドアロンでループの中で処理の場合、arcpy.mapping.ListLayersで取得しないと例外が発生するため変更
            route_solved = arcpy.mapping.ListLayers(outNALayer,naClasses[u'Routes'])[0]

            # print(" 7) Add Fields")
            # 必用な属性を追加
            fieldName1 = "updtime"
            arcpy.AddField_management(route_solved, fieldName1, "DATE")
            arcpy.CalculateField_management(route_solved, fieldName1, updatetime, "PYTHON_9.3", "#")

            fieldName2 = "delay"
            arcpy.AddField_management(route_solved, fieldName2, "SHORT")
            arcpy.CalculateField_management(route_solved, fieldName2, delaytime, "PYTHON_9.3","#")

            # 属性を更新
            #print route_solved
            # print(" 8) Append Route result")
            if arcpy.Exists(delay_railroad_fc):
                management = arcpy.Append_management(route_solved, delay_railroad_fc, "NO_TEST")
            else:
                arcpy.FeatureClassToFeatureClass_conversion(route_solved, inws, delay_railroad_fc_name)

            # u'Route/RoutesStops'の形式でないと次の処理できない
            #stop_solved = u'{0}\{1}'.format(u"Route", arcpy.na.GetNAClassNames(outNALayer)['Stops'])
            # 2018.3.8: スタンドアロンでループの中で処理の場合、arcpy.mapping.ListLayersで取得しないと例外が発生するため変更
            stop_solved = arcpy.mapping.ListLayers(outNALayer,naClasses[u'Stops'])[0]
            arcpy.AddField_management(stop_solved, fieldName1, "DATE")
            arcpy.CalculateField_management(stop_solved,  fieldName1, updatetime, "PYTHON_9.3", "#")

            # print(" 9) Append Stops result")
            if arcpy.Exists(delay_station_fc):
                arcpy.Append_management(stop_solved, delay_station_fc, "NO_TEST")
            else:
                arcpy.FeatureClassToFeatureClass_conversion(stop_solved, inws, delay_station_fc_name)

            # 次のレコード処理する前に初期化
            arcpy.DeleteFeatures_management(route_solved)
            arcpy.DeleteFeatures_management(stop_solved)
            arcpy.Delete_management("stop_sta")

        # 終了メッセージ
        fin = datetime.datetime.now()
        printFinishMessage(funcname, fin)
        # 処理時間
        printElapsedMessage(funcname, fin-start)

    except arcpy.ExecuteError as e:
        # GP エラー
        logging.debug(str(e).decode('utf-8'))
        #print str(e).decode('utf-8')
        raise
    except Exception as e:
        # Python エラー
        logging.debug(str(e).decode('utf-8'))
        #print str(e).decode('utf-8')
        raise
    finally:
        # 後始末はいる
        arcpy.Delete_management(outNALayer)


def getopendata(ws):

    logging.debug('--start get opnedata!')
    # call opendata
    params = urllib.urlencode({'odpt:operator': 'odpt.Operator:TokyoMetro', 'acl:consumerKey': 'set_yourkey'})
    data = urllib.urlopen("https://api-tokyochallenge.odpt.org/api/v4/odpt:Train?%s" % params)

    # transfor Json Obj
    # json output : http://programming-study.com/technology/python-json-output/
    trainjson = json.loads(data.read().decode('utf-8'))

    # create csv file dateString
    filerowdate = trainjson[0][u'dc:date'].replace("+09:00","")
    filedate = datetime.datetime.strptime(filerowdate, '%Y-%m-%dT%H:%M:%S')
    global filedatestr
    filedatestr = filedate.strftime("%Y%m%d_%H%M%S")

    # conversion csv file
    targetdir = os.path.dirname(ws)
    targetfile = os.path.join(targetdir ,'train.csv')
    f = codecs.open(targetfile, mode='w', encoding= 'shift_jis') #opens csv file)
    writer = csv.writer(f)
    # Write CSV Header, If you dont need that, remove this line
    writer.writerow(['owl_sameAs','odpt_railway','odpt_terminalStation','odpt_operator','_id',
                        'odpt_trainType','odpt_toStation','odpt_railDirection','odpt_fromStation',
                        'odpt_startingStation','odpt_delay','odpt_trainNumber','odpt_frequency',
                        'dc_date','odpt_trainOwner','_context','dct_valid','_type'])

    for line in trainjson:
        writer.writerow([line.get(u'owl:sameAs'),
        line.get(u'odpt:railway'),
        line.get(u'odpt:terminalStation'),
        line.get(u'odpt:operator'),
        line.get(u'@id'),
        line.get(u'odpt:trainType'),
        line.get(u'odpt:toStation'),
        line.get(u'odpt:railDirection'),
        line.get(u'odpt:fromStation'),
        line.get(u'odpt:startingStation'),
        line.get(u'odpt:delay'),
        line.get(u'odpt:trainNumber'),
        line.get(u'odpt:frequency'),
        line.get(u'dc:date'),
        line.get(u'odpt:trainOwner'),
        line.get(u'@context'),
        line.get(u'dct:valid'),
        line.get(u'@type')])

    logging.debug('---csv complete')
    f.close()

def setlogger(ws):

    targetdir = os.path.dirname(ws)
    logDir = os.path.join(targetdir,'logs')
    tlogfile = os.path.join(logDir ,'app.log')
    logging.basicConfig(filename=tlogfile,
                        level=logging.DEBUG,
                        )
    calltime = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    logging.debug('call Get Opendata________'+calltime)

    f = open(tlogfile, 'rt')
    try:
        body = f.read()
    finally:
        f.close()


if __name__ == '__main__':
    setupSearchRailway()