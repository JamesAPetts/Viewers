import messageDialog from './messageDialog.js';
import { icrXnatRoiSession } from 'meteor/icr:xnat-roi-namespace';

/**
 * Opens dialog to notify the user when an export was unsuccessful.
 *
 * @author JamesAPetts
 */
export function displayExportFailedDialog () {
  const title = 'Export Failed';
  const body = `Export of ROIs to ${icrXnatRoiSession.get("projectId")}/${icrXnatRoiSession.get("experimentLabel")}`
    + ' failed. This may be due a bad internet connection. The ROIs have not been locked, if you want'
    + ' to try again. If you have a good connection to XNAT and this problem persists, please contact'
    + ' your XNAT administrator.';
  messageDialog(title, body);
}

/**
 * Opens dialog to notify the user that they do not have the
 * required permissions.
 *
 * @author JamesAPetts
 */
export function displayInsufficientPermissionsDialog () {
  const title = 'Insufficient Permissions';
  const body = `You do not have the required permissions to write ROI Collections to ${icrXnatRoiSession.get("projectId")}/${icrXnatRoiSession.get("experimentLabel")}.`
  + ' If you believe that you should, please contact the project owner.'

  messageDialog(title, body);
}

/**
 * Opens dialog to notify the user that the Mask ROI Collection they are trying
 * to export has not been modified from the XNAT version.
 *
 * @author JamesAPetts
 */
export function displayMaskNotModifiedDialog (roiCollection) {
  const title = 'ROI Collection Not Modified';
  const body = `The segmentations in the ROI Collection "${roiCollection.name}" have not been modified, aborting export.`;

  messageDialog(title, body);
}

/**
 * Opens dialog to notify the user that NIFTI exports are not possible yet.
 *
 * @author JamesAPetts
 */
export function displayCantExportNIFTIDialog (roiCollection) {
  const title = 'Cannot export NIFTI.';
  const body = `NIFTI export has not yet been implemented. The modified segmentations in ROI Collection "${roiCollection.name}" have not been saved.`;

  messageDialog(title, body);
}