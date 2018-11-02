import { OHIF } from 'meteor/ohif:core';
import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { MaskExtractor } from '../classes/MaskExtractor.js';
import { SeriesInfoProvider } from 'meteor/icr:series-info-provider';
import { DICOMSEGWriter } from '../classes/DICOMSEGWriter.js';
import closeIODialog from './closeIODialog.js';
import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';

const modules = cornerstoneTools.store.modules;
const getToolState = cornerstoneTools.import('stateManagement/getToolState');
const globalToolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;

/**
 * If the user has write permissions, begin export event. Otherwise notify the
 * user that they don't have sufficient permissions to do this.
 *
 * @author JamesAPetts
 */
export function maskExport () {

  const seriesInfo = SeriesInfoProvider.getActiveSeriesInfo();
  const seriesInstanceUid = seriesInfo.seriesInstanceUid;
  const maskExtractor = new MaskExtractor(seriesInstanceUid);

  const masks = maskExtractor.extractMasks();

  // TODO DICOM or NIFTI will have different export channels here!

  const dicomSegWriter = new DICOMSEGWriter(seriesInfo);
  dicomSegWriter.writeDICOMSeg(masks);
}