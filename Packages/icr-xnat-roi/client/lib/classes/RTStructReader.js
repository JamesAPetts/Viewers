import { OHIF } from 'meteor/ohif:core';
import { Polygon } from '../classes/Polygon.js';
import { dicomParser } from 'meteor/ohif:cornerstone';
import { cornerstoneTools } from 'meteor/ohif:cornerstone';

const modules = cornerstoneTools.store.modules;

export class RTStructReader {

  constructor (rtStructArrayBuffer, seriesInstanceUidToImport, roiCollectionName, roiCollectionLabel) {
    this._dataSet = this._getdataSet(rtStructArrayBuffer);
    this._isRTStruct();

    this._polygons = [];
    this._seriesInstanceUidToImport = seriesInstanceUidToImport;
    this._roiCollectionName = roiCollectionName;
    this._roiCollectionLabel = roiCollectionLabel;
    this._sopInstanceUid = this._dataSet.string( RTStructTag['SOPInstanceUID'] );
    this._structureSetName = this._dataSet.string( RTStructTag['StructureSetName'] );
    this._structureSetLabel = this._dataSet.string( RTStructTag['StructureSetLabel'] );

    this._sopInstancesInSeries = this._getSopInstancesInSeries();

    this._freehand3DStore = modules.freehand3D;

    if ( this._sopInstancesInSeries.length > 0 ) {
      this._extractVolumes();
    }
  }

  _getdataSet (rtStructArrayBuffer) {
    let byteArray = new Uint8Array(rtStructArrayBuffer);

    let dataSet = null;
    try {
      dataSet = dicomParser.parseDicom(byteArray);
    } catch (err) {
      console.log(err.message);
      console.log('File is not a valid DICOM file!');
    }

    return dataSet;
  }

  _isRTStruct () {
    const SOPClassUID = this._dataSet.string( RTStructTag['SOPClassUID'] );
    if (SOPClassUID !== RadiationTherapyStructureSetStorage) {
      throw `DICOM file is not an RT-Struct. It has SOPClassUID: ${SOPClassUID}`;
    }

    return;
  }

  _getSopInstancesInSeries () {
    let sopInstanceUids = [];
    const RTReferencedSeries = this._getRTReferenceSeries();

    if ( RTReferencedSeries !== null ) {
      const ContourImageSequenceItems = RTReferencedSeries.dataSet.elements[ RTStructTag['ContourImageSequence'] ].items;

      for ( let i = 0; i < ContourImageSequenceItems.length; i++ ) {
        const ContourImage = ContourImageSequenceItems[i];
        const sopInstanceUid = ContourImage.dataSet.string( RTStructTag['ReferencedSOPInstanceUID']);
        sopInstanceUids.push(sopInstanceUid);
      }
    }

    return sopInstanceUids;
  }


  _getRTReferenceSeries () {
    const ReferencedFrameofReferenceSequenceItems = this._dataSet.elements[ RTStructTag['ReferencedFrameofReferenceSequence'] ].items;

    for (let i = 0; i < ReferencedFrameofReferenceSequenceItems.length; i++ ) {
      const ReferencedFrameofReference = ReferencedFrameofReferenceSequenceItems[i];
      const RTReferencedStudySequenceItems = ReferencedFrameofReference.dataSet.elements[ RTStructTag['RTReferencedStudySequence'] ].items;

      for (let j = 0; j < RTReferencedStudySequenceItems.length; j++ ) {
        const RTReferencedStudy = RTReferencedStudySequenceItems[j];
        const RTReferencedSeriesSequenceItems = RTReferencedStudy.dataSet.elements[ RTStructTag['RTReferencedSeriesSequence'] ].items;

        for (let k = 0; k < RTReferencedSeriesSequenceItems.length; k++ ) {
          const RTReferencedSeries = RTReferencedSeriesSequenceItems[k];
          const seriesInstanceUid = RTReferencedSeries.dataSet.string( RTStructTag['SeriesInstanceUID'] );
          if ( seriesInstanceUid === this._seriesInstanceUidToImport ) {
            return RTReferencedSeries;
          }
        }
      }
    }

    return null;
  }


  _extractVolumes () {
    const ROIContourSequence = this._dataSet.elements[ RTStructTag['ROIContourSequence'] ];
    const volumes = ROIContourSequence.items;
    for ( let i = 0; i < volumes.length; i++ ) {
      this._extractOneVolume(volumes[i].dataSet);
    }
  }


  _extractOneVolume (volumeDataSet) {
    const ROINumber = volumeDataSet.string( RTStructTag['ReferencedROINumber'] );

    const ROIContourUid = this._createNewVolumeAndGetUid(ROINumber);

    const contourSequence = volumeDataSet.elements[ RTStructTag['ContourSequence'] ];
    const contours = contourSequence.items;
    for ( let i = 0; i < contours.length; i++ ) {
      this._extractOneContour(contours[i].dataSet, ROIContourUid, ROINumber);
    }
  }


  _createNewVolumeAndGetUid (ROINumber) {
    const freehand3DStore = this._freehand3DStore;
    let name;
    let uid;

    uid = `${this._sopInstanceUid}.${this._structureSetLabel}.${ROINumber}`;

    if (this._structureSetName) { // StructureSetName is Type 3: Optional
      name = `${this._structureSetName} Lesion ${ROINumber}`;
    } else { // StructureSetLabel is Type: Mandatory and not empty
      name =` ${this._structureSetLabel} Lesion ${ROINumber}`;
    }

    this._addStructureSetIfNotPresent();

    const ROIContourUid = freehand3DStore.setters.ROIContour(
      this._seriesInstanceUidToImport,
      this._roiCollectionLabel,
      name,
      {
        uid
      }
    );

    return ROIContourUid;
  }

  _addStructureSetIfNotPresent () {
    const freehand3DStore = this._freehand3DStore;

    const structureSet = freehand3DStore.getters.structureSet(
      this._seriesInstanceUidToImport,
      this._roiCollectionLabel
    );

    if (!structureSet) {
      freehand3DStore.setters.structureSet(
        this._seriesInstanceUidToImport,
        this._roiCollectionName,
        {
          isLocked: true,
          visible: true,
          uid: this._roiCollectionLabel
        }
      );
    }
  }


  _extractOneContour (contourSequenceItemData, ROIContourUid, ROINumber) {
    // Only parse closed polygons
    const contourGeometricType = contourSequenceItemData.string( RTStructTag['ContourGeometricType'] );
    if ( contourGeometricType !== 'CLOSED_PLANAR' ) {
      return;
    }

    const contourImageSequenceData = contourSequenceItemData.elements[ RTStructTag['ContourImageSequence'] ].items[0].dataSet;
    const referencedSopInstanceUid = contourImageSequenceData.string( RTStructTag['ReferencedSOPInstanceUID'] );

    // Don't extract polygon if it doesn't belong to the series being imported
    if ( !this._sopInstancesInSeries.includes(referencedSopInstanceUid) ) {
      console.log(`referencedSopInstanceUid: ${referencedSopInstanceUid} not in reference list`);
      return;
    }

    const referencedFrameNumber = contourImageSequenceData.string( RTStructTag['ReferencedFrameNumber'] );
    const contourNumber = contourSequenceItemData.string( RTStructTag['ContourNumber'] );
    const polygonUid = `${this._sopInstanceUid}.${ROINumber}.${contourNumber}`;

    const handles = this._extractPoints(contourSequenceItemData, referencedSopInstanceUid);
    const polygon = new Polygon(
      handles,
      referencedSopInstanceUid,
      this._seriesInstanceUidToImport,
      this._roiCollectionLabel,
      ROIContourUid,
      polygonUid,
      referencedFrameNumber
    );

    this._polygons.push(polygon);
  }


  _extractPoints (contourSequenceItemData, referencedSopInstanceUid) {
    const handles = [];
    const numPoints = contourSequenceItemData.intString( RTStructTag['NumberofContourPoints'] );
    const numValues = numPoints * 3;

    for ( let i = 0; i < numValues; i += 3 ) {
      handles.push({
        x: contourSequenceItemData.floatString( RTStructTag['ContourData'], i),
        y: contourSequenceItemData.floatString( RTStructTag['ContourData'], i + 1),
        z: contourSequenceItemData.floatString( RTStructTag['ContourData'], i + 2)
      });
    }

    return handles;
  }

  get polygons() {
    return this._polygons;
  }

}




const RadiationTherapyStructureSetStorage = '1.2.840.10008.5.1.4.1.1.481.3';

const RTStructTag = {
  SOPClassUID:                    'x00080016',
  SOPInstanceUID:                 'x00080018',
  ROIContourSequence:             'x30060039',
  ROINumber:                      'x30060022',
  ReferencedROINumber:            'x30060084',
  ContourSequence:                'x30060040',
  ContourImageSequence:           'x30060016',
  ReferencedSOPInstanceUID:       'x00081155',
  ReferencedFrameNumber:          'x00081160',
  ContourNumber:                  'x30060048',
  ContourGeometricType:           'x30060042',
  NumberofContourPoints:          'x30060046',
  ContourData:                    'x30060050',
  StructureSetROISequence:        'x30060020',
  ReferencedFrameofReferenceUID:  'x30060024',
  ReferencedFrameofReferenceSequence: 'x30060010',
  FrameofReferenceUID:                'x00200052',
  RTReferencedStudySequence:          'x30060012',
  RTReferencedSeriesSequence:         'x30060014',
  SeriesInstanceUID:                  'x0020000e',
  ReferencedSOPInstanceUID:           'x00081155',
  StructureSetName:                   'x30060004',
  StructureSetLabel:                  'x30060002'
}
