import { api } from 'dicomweb-client';
import { mapParams, search as qidoSearch, processResults } from './qido.js';
import { dicomMetadataStore, IWebApiDataSource, utils } from '@ohif/core';
import * as dcmjs from 'dcmjs';
import { retrieveStudyMetadata } from './retrieveStudyMetadata.js';

const { naturalizeDataset } = dcmjs.data.DicomMetaDictionary;
const { urlUtil } = utils;

const exampleInstances = [
  {
    '00080005': { vr: 'CS', Value: ['ISO_IR 100'] },
    '00080008': { vr: 'CS', Value: ['ORIGINAL', 'PRIMARY', 'LOCALIZER'] },
    '00080016': { vr: 'UI', Value: ['1.2.840.10008.5.1.4.1.1.2'] },
    '00080018': {
      vr: 'UI',
      Value: ['1.3.6.1.4.1.25403.345050719074.3824.20170126082902.6'],
    },
    '00080020': { vr: 'DA', Value: ['20141125'] },
    '00080021': { vr: 'DA', Value: ['20141125'] },
    '00080022': { vr: 'DA', Value: ['20141125'] },
    '00080023': { vr: 'DA', Value: ['20141125'] },
    '00080030': { vr: 'TM', Value: ['094528.000'] },
    '00080031': { vr: 'TM', Value: ['094604.688'] },
    '00080032': { vr: 'TM', Value: ['094623.600'] },
    '00080033': { vr: 'TM', Value: ['094623.600'] },
    '00080050': { vr: 'SH', Value: ['000092218'] },
    '00080060': { vr: 'CS', Value: ['CT'] },
    '00080070': { vr: 'LO', Value: ['TOSHIBA'] },
    '00080080': { vr: 'LO', Value: ['Precision Imaging Metrics'] },
    '00080090': { vr: 'PN' },
    '00081010': { vr: 'SH' },
    '00081030': { vr: 'LO', Value: ['DFCI CT CHEST W CONTRAST 6023'] },
    '00081032': {
      vr: 'SQ',
      Value: [
        {
          '00080100': { vr: 'SH', Value: ['6023'] },
          '00080102': { vr: 'SH', Value: ['GEIIS'] },
          '00080103': { vr: 'SH', Value: ['0'] },
          '00080104': { vr: 'LO', Value: ['DFCI CT CHEST W CONTRAST 6023'] },
        },
      ],
    },
    '0008103E': { vr: 'LO', Value: ['2.0'] },
    '00081040': { vr: 'LO' },
    '00081070': { vr: 'PN' },
    '00081090': { vr: 'LO', Value: ['Aquilion'] },
    '00081110': {
      vr: 'SQ',
      Value: [
        {
          '00081150': { vr: 'UI', Value: ['1.2.840.100008.3.1.2.3.1'] },
          '00081155': {
            vr: 'UI',
            Value: ['1.3.6.1.4.1.25403.345050719074.3824.20170126082902.4'],
          },
        },
      ],
    },
    '00100010': { vr: 'PN', Value: [{ Alphabetic: 'Venus' }] },
    '00100020': { vr: 'LO', Value: ['0000005'] },
    '00100021': { vr: 'LO', Value: ['001R74:20050625:205502036:195212'] },
    '00100030': { vr: 'DA' },
    '00100040': { vr: 'CS', Value: ['F'] },
    '00101000': { vr: 'LO' },
    '00101010': { vr: 'AS' },
    '00101020': { vr: 'DS' },
    '00101030': { vr: 'DS' },
    '00104000': { vr: 'LT' },
    '00180015': { vr: 'CS', Value: ['CHEST_TO_PELVIS'] },
    '00180022': { vr: 'CS', Value: ['SCANOSCOPE'] },
    '00180050': { vr: 'DS', Value: [2.0] },
    '00180060': { vr: 'DS', Value: [120.0] },
    '00180090': { vr: 'DS', Value: [1000.0] },
    '00181000': { vr: 'LO' },
    '00181020': { vr: 'LO', Value: ['V4.86ER003'] },
    '00181030': { vr: 'LO', Value: ['Chest / Abdomen/Pelvis 5mm'] },
    '00181100': { vr: 'DS', Value: [1000.0] },
    '00181120': { vr: 'DS', Value: [0.0] },
    '00181130': { vr: 'DS', Value: [102.0] },
    '00181140': { vr: 'CS', Value: ['CW'] },
    '00181150': { vr: 'IS', Value: [6840] },
    '00181151': { vr: 'IS', Value: [100] },
    '00181152': { vr: 'IS', Value: [600] },
    '00181160': { vr: 'SH', Value: ['LARGE'] },
    '00181170': { vr: 'IS', Value: [12] },
    '00181190': { vr: 'DS', Value: [1.6, 1.4] },
    '00181210': { vr: 'SH', Value: ['FL03'] },
    '00185100': { vr: 'CS', Value: ['FFS'] },
    '0020000D': {
      vr: 'UI',
      Value: ['1.3.6.1.4.1.25403.345050719074.3824.20170126082902.1'],
    },
    '0020000E': {
      vr: 'UI',
      Value: ['1.3.6.1.4.1.25403.345050719074.3824.20170126082902.2'],
    },
    '00200010': { vr: 'SH' },
    '00200011': { vr: 'IS', Value: [1] },
    '00200012': { vr: 'IS', Value: [2] },
    '00200013': { vr: 'IS', Value: [2] },
    '00200020': { vr: 'CS', Value: ['F', 'P'] },
    '00200032': { vr: 'DS', Value: [-1.7e-4, -512.0, 1925.0] },
    '00200037': { vr: 'DS', Value: [0.0, 0.0, -1.0, 0.0, 1.0, -0.0] },
    '00200052': {
      vr: 'UI',
      Value: ['1.3.6.1.4.1.25403.345050719074.3824.20170126082902.5'],
    },
    '00201040': { vr: 'LO' },
    '00201041': { vr: 'DS', Value: [342.0] },
    '00280002': { vr: 'US', Value: [1] },
    '00280004': { vr: 'CS', Value: ['MONOCHROME2'] },
    '00280010': { vr: 'US', Value: [512] },
    '00280011': { vr: 'US', Value: [512] },
    '00280030': { vr: 'DS', Value: [2.0, 2.0] },
    '00280100': { vr: 'US', Value: [16] },
    '00280101': { vr: 'US', Value: [16] },
    '00280102': { vr: 'US', Value: [15] },
    '00280103': { vr: 'US', Value: [1] },
    '00281050': { vr: 'DS', Value: [110.0] },
    '00281051': { vr: 'DS', Value: [320.0] },
    '00281052': { vr: 'DS', Value: [0.0] },
    '00281053': { vr: 'DS', Value: [1.0] },
    '00321033': { vr: 'LO', Value: ['OUTDFRAD'] },
    '00400002': { vr: 'DA', Value: ['20141125'] },
    '00400003': { vr: 'TM', Value: ['091000'] },
    '00400004': { vr: 'DA', Value: ['20141125'] },
    '00400005': { vr: 'TM', Value: ['094000.000'] },
    '00400244': { vr: 'DA', Value: ['20141125'] },
    '00400245': { vr: 'TM', Value: ['094528.000'] },
    '00400253': { vr: 'SH', Value: ['3708'] },
    '00400260': {
      vr: 'SQ',
      Value: [
        {
          '00080100': { vr: 'SH', Value: ['6035'] },
          '00080102': { vr: 'SH', Value: ['CCG_CSTemp'] },
          '00080104': { vr: 'LO', Value: ['6035/DFCT2 CT 3-SITES W/OC'] },
        },
      ],
    },
    '00402017': { vr: 'LO', Value: ['14159097'] },
    '7FE00010': {
      vr: 'OW',
      BulkDataURI:
        'http://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs/studies/1.3.6.1.4.1.25403.345050719074.3824.20170126082902.1/series/1.3.6.1.4.1.25403.345050719074.3824.20170126082902.2/instances/1.3.6.1.4.1.25403.345050719074.3824.20170126082902.6',
    },
  },
  {
    '00080005': { vr: 'CS', Value: ['ISO_IR 100'] },
    '00080008': { vr: 'CS', Value: ['ORIGINAL', 'PRIMARY', 'LOCALIZER'] },
    '00080016': { vr: 'UI', Value: ['1.2.840.10008.5.1.4.1.1.2'] },
    '00080018': {
      vr: 'UI',
      Value: ['1.3.6.1.4.1.25403.345050719074.3824.20170126082902.3'],
    },
    '00080020': { vr: 'DA', Value: ['20141125'] },
    '00080021': { vr: 'DA', Value: ['20141125'] },
    '00080022': { vr: 'DA', Value: ['20141125'] },
    '00080023': { vr: 'DA', Value: ['20141125'] },
    '00080030': { vr: 'TM', Value: ['094528.000'] },
    '00080031': { vr: 'TM', Value: ['094604.688'] },
    '00080032': { vr: 'TM', Value: ['094557.250'] },
    '00080033': { vr: 'TM', Value: ['094557.250'] },
    '00080050': { vr: 'SH', Value: ['000092218'] },
    '00080060': { vr: 'CS', Value: ['CT'] },
    '00080070': { vr: 'LO', Value: ['TOSHIBA'] },
    '00080080': { vr: 'LO', Value: ['Precision Imaging Metrics'] },
    '00080090': { vr: 'PN' },
    '00081010': { vr: 'SH' },
    '00081030': { vr: 'LO', Value: ['DFCI CT CHEST W CONTRAST 6023'] },
    '00081032': {
      vr: 'SQ',
      Value: [
        {
          '00080100': { vr: 'SH', Value: ['6023'] },
          '00080102': { vr: 'SH', Value: ['GEIIS'] },
          '00080103': { vr: 'SH', Value: ['0'] },
          '00080104': { vr: 'LO', Value: ['DFCI CT CHEST W CONTRAST 6023'] },
        },
      ],
    },
    '0008103E': { vr: 'LO', Value: ['2.0'] },
    '00081040': { vr: 'LO' },
    '00081070': { vr: 'PN' },
    '00081090': { vr: 'LO', Value: ['Aquilion'] },
    '00081110': {
      vr: 'SQ',
      Value: [
        {
          '00081150': { vr: 'UI', Value: ['1.2.840.100008.3.1.2.3.1'] },
          '00081155': {
            vr: 'UI',
            Value: ['1.3.6.1.4.1.25403.345050719074.3824.20170126082902.4'],
          },
        },
      ],
    },
    '00100010': { vr: 'PN', Value: [{ Alphabetic: 'Venus' }] },
    '00100020': { vr: 'LO', Value: ['0000005'] },
    '00100021': { vr: 'LO', Value: ['001R74:20050625:205502036:195212'] },
    '00100030': { vr: 'DA' },
    '00100040': { vr: 'CS', Value: ['F'] },
    '00101000': { vr: 'LO' },
    '00101010': { vr: 'AS' },
    '00101020': { vr: 'DS' },
    '00101030': { vr: 'DS' },
    '00104000': { vr: 'LT' },
    '00180015': { vr: 'CS', Value: ['CHEST_TO_PELVIS'] },
    '00180022': { vr: 'CS', Value: ['SCANOSCOPE'] },
    '00180050': { vr: 'DS', Value: [2.0] },
    '00180060': { vr: 'DS', Value: [120.0] },
    '00180090': { vr: 'DS', Value: [1000.0] },
    '00181000': { vr: 'LO' },
    '00181020': { vr: 'LO', Value: ['V4.86ER003'] },
    '00181030': { vr: 'LO', Value: ['Chest / Abdomen/Pelvis 5mm'] },
    '00181100': { vr: 'DS', Value: [1000.0] },
    '00181120': { vr: 'DS', Value: [0.0] },
    '00181130': { vr: 'DS', Value: [102.0] },
    '00181140': { vr: 'CS', Value: ['CW'] },
    '00181150': { vr: 'IS', Value: [6857] },
    '00181151': { vr: 'IS', Value: [50] },
    '00181152': { vr: 'IS', Value: [300] },
    '00181160': { vr: 'SH', Value: ['LARGE'] },
    '00181170': { vr: 'IS', Value: [6] },
    '00181190': { vr: 'DS', Value: [1.6, 1.4] },
    '00181210': { vr: 'SH', Value: ['FL03'] },
    '00185100': { vr: 'CS', Value: ['FFS'] },
    '0020000D': {
      vr: 'UI',
      Value: ['1.3.6.1.4.1.25403.345050719074.3824.20170126082902.1'],
    },
    '0020000E': {
      vr: 'UI',
      Value: ['1.3.6.1.4.1.25403.345050719074.3824.20170126082902.2'],
    },
    '00200010': { vr: 'SH' },
    '00200011': { vr: 'IS', Value: [1] },
    '00200012': { vr: 'IS', Value: [1] },
    '00200013': { vr: 'IS', Value: [1] },
    '00200020': { vr: 'CS', Value: ['L', 'F'] },
    '00200032': { vr: 'DS', Value: [-512.0, 1.7e-4, 1925.0] },
    '00200037': { vr: 'DS', Value: [1.0, 0.0, 0.0, 0.0, 0.0, -1.0] },
    '00200052': {
      vr: 'UI',
      Value: ['1.3.6.1.4.1.25403.345050719074.3824.20170126082902.5'],
    },
    '00201040': { vr: 'LO' },
    '00201041': { vr: 'DS', Value: [342.0] },
    '00280002': { vr: 'US', Value: [1] },
    '00280004': { vr: 'CS', Value: ['MONOCHROME2'] },
    '00280010': { vr: 'US', Value: [512] },
    '00280011': { vr: 'US', Value: [512] },
    '00280030': { vr: 'DS', Value: [2.0, 2.0] },
    '00280100': { vr: 'US', Value: [16] },
    '00280101': { vr: 'US', Value: [16] },
    '00280102': { vr: 'US', Value: [15] },
    '00280103': { vr: 'US', Value: [1] },
    '00281050': { vr: 'DS', Value: [100.0] },
    '00281051': { vr: 'DS', Value: [230.0] },
    '00281052': { vr: 'DS', Value: [0.0] },
    '00281053': { vr: 'DS', Value: [1.0] },
    '00321033': { vr: 'LO', Value: ['OUTDFRAD'] },
    '00400002': { vr: 'DA', Value: ['20141125'] },
    '00400003': { vr: 'TM', Value: ['091000'] },
    '00400004': { vr: 'DA', Value: ['20141125'] },
    '00400005': { vr: 'TM', Value: ['094000.000'] },
    '00400244': { vr: 'DA', Value: ['20141125'] },
    '00400245': { vr: 'TM', Value: ['094528.000'] },
    '00400253': { vr: 'SH', Value: ['3708'] },
    '00400260': {
      vr: 'SQ',
      Value: [
        {
          '00080100': { vr: 'SH', Value: ['6035'] },
          '00080102': { vr: 'SH', Value: ['CCG_CSTemp'] },
          '00080104': { vr: 'LO', Value: ['6035/DFCT2 CT 3-SITES W/OC'] },
        },
      ],
    },
    '00402017': { vr: 'LO', Value: ['14159097'] },
    '7FE00010': {
      vr: 'OW',
      BulkDataURI:
        'http://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs/studies/1.3.6.1.4.1.25403.345050719074.3824.20170126082902.1/series/1.3.6.1.4.1.25403.345050719074.3824.20170126082902.2/instances/1.3.6.1.4.1.25403.345050719074.3824.20170126082902.3',
    },
  },
];

/**
 *
 * @param {string} name - Data source name
 * @param {string} wadoUriRoot - Legacy? (potentially unused/replaced)
 * @param {string} qidoRoot - Base URL to use for QIDO requests
 * @param {string} wadoRoot - Base URL to use for WADO requests
 * @param {boolean} qidoSupportsIncludeField - Whether QIDO supports the "Include" option to request additional fields in response
 * @param {string} imageRengering - wadors | ? (unsure of where/how this is used)
 * @param {string} thumbnailRendering - wadors | ? (unsure of where/how this is used)
 * @param {bool} lazyLoadStudy - "enableStudyLazyLoad"; Request series meta async instead of blocking
 */
function createDicomWebApi(dicomWebConfig) {
  const { qidoRoot, wadoRoot, enableStudyLazyLoad } = dicomWebConfig;

  const qidoConfig = {
    url: qidoRoot,
    // headers: DICOMWeb.getAuthorizationHeader(server),
  };

  const wadoConfig = {
    url: wadoRoot,
  };

  // TODO -> Two clients sucks, but its better than 1000.
  // TODO -> We'll need to merge auth later.
  const qidoDicomWebClient = new api.DICOMwebClient(qidoConfig);
  const wadoDicomWebClient = new api.DICOMwebClient(wadoConfig);

  return IWebApiDataSource.create({
    query: {
      studies: {
        mapParams: mapParams.bind(),
        search: async function(origParams) {
          const { studyInstanceUid, seriesInstanceUid, ...mappedParams } =
            mapParams(origParams) || {};

          const results = await qidoSearch(
            qidoDicomWebClient,
            studyInstanceUid,
            seriesInstanceUid,
            mappedParams
          );

          return processResults(results);
        },
        processResults: processResults.bind(),
      },
      instances: {
        search: (studyInstanceUid, queryParamaters) =>
          qidoSearch.call(
            undefined,
            qidoDicomWebClient,
            studyInstanceUid,
            null,
            queryParamaters
          ),
      },
    },
    retrieve: {
      series: {
        metadata: (queryParams, callback) => {
          let { StudyInstanceUIDs } = urlUtil.parse(queryParams, true);

          StudyInstanceUIDs = urlUtil.paramString.parseParam(StudyInstanceUIDs);

          if (!StudyInstanceUIDs) {
            throw new Error(
              'Incomplete queryParams, missing StudyInstanceUIDs'
            );
          }

          const storeInstances = instances => {
            const naturalizedInstances = instances.map(naturalizeDataset);

            dicomMetadataStore.addInstances(naturalizedInstances);
            callback(naturalizedInstances);
          };

          const studyPromises = StudyInstanceUIDs.map(StudyInstanceUID =>
            retrieveStudyMetadata(
              wadoDicomWebClient,
              StudyInstanceUID,
              enableStudyLazyLoad
            )
          );

          studyPromises.forEach(studyPromise => {
            studyPromise.then(seriesPromises => {
              seriesPromises.forEach(seriesPromise => {
                seriesPromise.then(instances => {
                  debugger;
                  storeInstances(instances);
                });
              });
            });
          });

          // TEMP use dummy data.
          //const { naturalizeDataset } = dcmjs.data.DicomMetaDictionary;
          //const instances = exampleInstances.map(naturalizeDataset);

          // TEMP

          //dicomMetadataStore.addInstances(instances);
          //callback(instances);
        },
      },
    },
  });
}

export { createDicomWebApi };
