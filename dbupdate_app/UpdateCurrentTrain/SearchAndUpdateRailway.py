#coding:cp932
"""
UnicodeDecodeError: 'utf-8' codec can't decode byte 0x93 in position 0: invalid start byte
�̃G���[�ɂȂ�Ȃ��悤�ɁA�t�H���_�p�X�͉p��ɂ���

[�f�[�^�x�[�X�\��]
C:\arcgisserver\public\
  challenge_db.gdb
    |- NADATASET
       |- NADATASET_ND
       |- NADATASET_ND_Junctions
       |- Railroads_Metro     ---�O���H���i���g���j
       |- Stations_Metro      ---�w�i���g���j_PT
       |- station_metro_view  ---�w�i���g���j

    |- Delay_RailRoad_Metro  ---�O���H���i���g���j_�x��
    |- Delay_Station_Metro   ---�w�i���g���j_�x��
    |- KANTO_PREF            ---�s���{���i�֓��j
    |- RailRoadSection       ---�O���H��
    |- Station               ---�w

train.csv                  ---���ݎ擾���������p��CSV�t�@�C��
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

# �擾�t�@�C���̎��ԕ�����
filedatestr = 'def'

"""
���ʂ̏���
"""
def getTimeString(dcdate_val):
    # dc:date
    # "2018-02-28T00:31:48+09:00"���玟���쐬
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
    # fgdb�̏ꍇ
    ws = r"C:\arcgisserver\publish\challenge_db.gdb"
    fcdatasetname = "NADATASET"

    # ������ʂ�API����擾���ĕۑ�����t�@�C��
    train_csv_name = "train.csv"

    # 0.�o�̓��O�ݒ�
    setlogger(ws)

    # 1.API����擾����csv�t�@�C���ւ̕ۑ�����
    getopendata(ws)

    # 2.csv�t�@�C�������Ƃ�Delay_xxxx���ŐV�����鏈��
    getTrainLocations(ws, fcdatasetname, train_csv_name)



def getTrainLocations(gdbws, fcdatasetname, trainTableName):
    """
    �������API�̗�ԃ��P�[�V��������ϊ��ς݂�CSV�����Ƃ�
    ��ԃ��P�[�V���������擾��Delay_Railroad_Metro, Delay_Station_Metro ���ŐV��
    ��1�����Fchallenge_db.gdb�@�ւ̃t���p�X
    ��2�����F�t�B�[�`���f�[�^�Z�b�g��
    ��3�����F���݂̗�Ԓx��csv�t�@�C��
    """
    logging.debug('--arcgis processing:getTrainLocations')

    # Network Analyst�̃��C�Z���X���`�F�b�N�A�E�g
    arcpy.CheckOutExtension("Network")

    # Tips! �o�b�`�����ȂǌJ��Ԃ����邾�񂾂񑬓x�ቺ����̂Ń��O���I�t��
    arcpy.SetLogHistory(False)

    train_ws = os.path.dirname(gdbws)
    arcpy.env.workspace = train_ws

    # ���o����H����
    operator_name = 'odpt.Operator:TokyoMetro'

    # ���o����Ώۂ̒x�ꎞ��
    delayTime = 0

    # ����m�F�p
    #q_wh ="odpt_delay >= 0 AND odpt_operator = 'odpt.Operator:TokyoMetro' AND odpt_tostation IS NOT NULL AND odpt_fromstation IS NOT NULL"
    #q_wh = "odpt_delay >= {0} AND odpt_operator = '{1}' AND odpt_tostation IS NOT NULL AND odpt_fromstation IS NOT NULL".format(delayTime, operator_name)


    # �{�ԗp(FromStation �� ToStation�������Ă���ꍇ)
    q_wh = "odpt_delay > {0} AND odpt_operator = '{1}' AND odpt_tostation IS NOT NULL AND odpt_fromstation IS NOT NULL".format(delayTime, operator_name)
    #print q_wh

    fields = ['dc_date','odpt_delay','odpt_railway','odpt_fromstation','odpt_tostation','odpt_operator','odpt_trainnumber']

    try:

        with arcpy.da.SearchCursor(trainTableName, fields, q_wh) as cursor:
            # �o�b�`����������-�l�b�g���[�N��͂��s�Ȃ��֐�����RecordSet��n���悤�ɂ���
            trainLocationAnalBatch(gdbws, fcdatasetname, cursor)


    except arcpy.ExecuteError as e:
        # GP �G���[
        logging.debug(str(e).decode('utf-8'))
        #print str(e).decode('utf-8')
    except Exception as e:
        # Python �G���[
        logging.debug(str(e).decode('utf-8'))
        #print str(e).decode('utf-8')
    finally:
        # �t�@�C���̌�n��
        arcpy.Delete_management(trainTableName)


def trainLocationAnalBatch(inws, fcdatasetname, tableRows):

    # �J�n���b�Z�[�W
    funcname = "trainLocationAnalBatch"
    start = datetime.datetime.now()
    printStartMessage(funcname,start)

    # NADATASET��FeatureDataset��
    ws = os.path.join(inws, fcdatasetname)
    arcpy.env.workspace = ws

    inNetworkDataset_name = "NADATASET_ND"
    inNetworkDataset = os.path.join(ws, inNetworkDataset_name)
    #outNALayerName = "Route"
    outNALayerName = u"Route"
    impedanceAttribute = u"����"

    # �t�B�[�`���N���X��(FeatureDataset��)
    staion_fc_name = "Station_Metro"
    railroad_fc_name = "Railroad_Metro"
    station_fc = os.path.join(ws, staion_fc_name)
    railroad_fc = os.path.join(ws, railroad_fc_name)

    # �x���t�B�[�`���N���X��
    delay_station_fc_name = "Delay_Station_Metro"
    delay_railroad_fc_name = "Delay_Railroad_Metro"
    delay_station_fc  = os.path.join(os.path.dirname(ws), delay_station_fc_name)
    delay_railroad_fc = os.path.join(os.path.dirname(ws), delay_railroad_fc_name)

    try:

        # Delay_station��Delay_Railroad�̃��R�[�h�폜
        # 2018.3.8: �����t�B�[�`���N���X���Ȃ��ꍇ�ɂ��Ή�
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
        # 2018.3.8: outNALayer��naClasses�������Ŏ擾����悤�ɏC��
        outNALayer = arcpy.na.MakeRouteLayer(inNetworkDataset, outNALayerName, impedanceAttribute).getOutput(0)
        naClasses = arcpy.na.GetNAClassNames(outNALayer)


        # ���R�[�h����0���Ȃ牽�����Ȃ�
        # ����G���[�ɂȂ�B�B�B
        #if int(arcpy.GetCount_management(tableRows).getOutput(0)) < 1:
        #    return

        cnt = 0
        updatetime = ""

        for row in tableRows:
            if cnt == 0:
                updatetime = getTimeString(row[0]) #�b�P�ʂŃo����������̂Ń��R�[�h���ԂƂ���
            delaytime = row[1]
            railway_name = row[2]
            from_sta_name = row[3]
            to_sta_name = row[4]
            cnt = cnt + 1

            printMessage("{0}  ���� From:{1}  To:{2}".format(cnt, from_sta_name, to_sta_name))
            # x) ��������From�w��To�w�̃|�C���g��"stop_sta"���C���Ƃ��Ē��o
            #print(" 2) MakeFeatureLayer")
            sta_wh = "railway_sameas = '{0}' AND (station_sameas = '{1}' OR station_sameas = '{2}')".format(railway_name,from_sta_name,to_sta_name)
            arcpy.MakeFeatureLayer_management(station_fc, "stop_sta", sta_wh)
            #print arcpy.GetCount_management("stop_sta")
            if int(arcpy.GetCount_management("stop_sta").getOutput(0)) != 2:
                continue

            # x) fieldmapping�̋@�\��Name��RouteName�̑����͓���邱�Ƃ͉\
            # ��:Name - ��:station_sameas
            # ��:RouteName - ��:railway_sameas
            #print(" 3) FieldsMapping")
            station_fields = arcpy.ListFields(station_fc)
            stopsFieldMappings = arcpy.na.NAClassFieldMappings(outNALayer, naClasses[u'Stops'], False, station_fields)
            stopFieldMap1 = stopsFieldMappings[u"Name"]
            stopFieldMap1.mappedFieldName = "station_sameas"
            stopFieldMap2 = stopsFieldMappings[u"RouteName"]
            stopFieldMap2.mappedFieldName = "railway_sameas"


            # x) ���o����From�w��To�w��NALayer��Stops�Ƃ��Ēǉ�
            #print(" 4) AddLocations")
            # ����ݒ�ɂ���ĈقȂ�:locale-jp
            #arcpy.na.AddLocations(outNALayer,"�X�g�b�v", "stop_sta", stopsFieldMappings, "")
            # ����ݒ�ɂ���ĈقȂ�:locale-en
            #arcpy.na.AddLocations(outNALayer, "Stops", "stop_sta", stopsFieldMappings, "")
            # 2018.3.8: ����ݒ�Ŋ֌W�Ȃ��悤naClasses����擾����悤�ɏC��
            arcpy.na.AddLocations(outNALayer, naClasses[u'Stops'], "stop_sta", stopsFieldMappings, "")

            # x) ��͂̎��s�i���̂Ƃ���Name�Ƀe�[�u�������ł�����̂��w��ł���΁j
            #print(" 5) Solve")
            arcpy.na.Solve(outNALayer)

            # x) �������ʂ�"Route/Routes"�̃��C����ۑ�
            logging.debug(" 6) Get Routes")
            #print(" 6) Get Routes")
            # u'Route/Routes'�̌`���łȂ��Ǝ��̏����ł��Ȃ�
            #route_solved = u'{0}\{1}'.format(u"Route",arcpy.na.GetNAClassNames(outNALayer)['Routes'])
            # 2018.3.8: �X�^���h�A�����Ń��[�v�̒��ŏ����̏ꍇ�Aarcpy.mapping.ListLayers�Ŏ擾���Ȃ��Ɨ�O���������邽�ߕύX
            route_solved = arcpy.mapping.ListLayers(outNALayer,naClasses[u'Routes'])[0]

            # print(" 7) Add Fields")
            # �K�p�ȑ�����ǉ�
            fieldName1 = "updtime"
            arcpy.AddField_management(route_solved, fieldName1, "DATE")
            arcpy.CalculateField_management(route_solved, fieldName1, updatetime, "PYTHON_9.3", "#")

            fieldName2 = "delay"
            arcpy.AddField_management(route_solved, fieldName2, "SHORT")
            arcpy.CalculateField_management(route_solved, fieldName2, delaytime, "PYTHON_9.3","#")

            # �������X�V
            #print route_solved
            # print(" 8) Append Route result")
            if arcpy.Exists(delay_railroad_fc):
                management = arcpy.Append_management(route_solved, delay_railroad_fc, "NO_TEST")
            else:
                arcpy.FeatureClassToFeatureClass_conversion(route_solved, inws, delay_railroad_fc_name)

            # u'Route/RoutesStops'�̌`���łȂ��Ǝ��̏����ł��Ȃ�
            #stop_solved = u'{0}\{1}'.format(u"Route", arcpy.na.GetNAClassNames(outNALayer)['Stops'])
            # 2018.3.8: �X�^���h�A�����Ń��[�v�̒��ŏ����̏ꍇ�Aarcpy.mapping.ListLayers�Ŏ擾���Ȃ��Ɨ�O���������邽�ߕύX
            stop_solved = arcpy.mapping.ListLayers(outNALayer,naClasses[u'Stops'])[0]
            arcpy.AddField_management(stop_solved, fieldName1, "DATE")
            arcpy.CalculateField_management(stop_solved,  fieldName1, updatetime, "PYTHON_9.3", "#")

            # print(" 9) Append Stops result")
            if arcpy.Exists(delay_station_fc):
                arcpy.Append_management(stop_solved, delay_station_fc, "NO_TEST")
            else:
                arcpy.FeatureClassToFeatureClass_conversion(stop_solved, inws, delay_station_fc_name)

            # ���̃��R�[�h��������O�ɏ�����
            arcpy.DeleteFeatures_management(route_solved)
            arcpy.DeleteFeatures_management(stop_solved)
            arcpy.Delete_management("stop_sta")

        # �I�����b�Z�[�W
        fin = datetime.datetime.now()
        printFinishMessage(funcname, fin)
        # ��������
        printElapsedMessage(funcname, fin-start)

    except arcpy.ExecuteError as e:
        # GP �G���[
        logging.debug(str(e).decode('utf-8'))
        #print str(e).decode('utf-8')
        raise
    except Exception as e:
        # Python �G���[
        logging.debug(str(e).decode('utf-8'))
        #print str(e).decode('utf-8')
        raise
    finally:
        # ��n���͂���
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