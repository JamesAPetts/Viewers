import { OHIF } from 'meteor/ohif:core';
import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';

/**
 * Toggles the visibility and interactivity of the stats window for the freehand
 * tool.
 *
 * @author JamesAPetts
 */
export function toggleFreehandStats () {
  const enabledElement = OHIF.viewerbase.viewportUtils.getEnabledElementForActiveElement();

  if (!enabledElement) {
      return;
  }

  console.log(enabledElement);

  const element = enabledElement.element;

  const freehandMousetool = cornerstoneTools.getToolForElement(element, 'freehandMouse');

  console.log(freehandMousetool);

  freehandMousetool.configuration.alwaysShowTextBox = !freehandMousetool.configuration.alwaysShowTextBox;

  cornerstone.updateImage(element);
}
