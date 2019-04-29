import { createNewVolume } from "meteor/icr:peppermint-tools";
import { cornerstoneTools } from "meteor/ohif:cornerstone";

const modules = cornerstoneTools.store.modules;

Template.roiCollectionBuilderDialogs.onRendered(() => {
  const instance = Template.instance();
  const id = "roiCollectionBuilderDialog";

  const dialog = instance.$("#" + id);
  instance.data.dialog = dialog;

  dialogPolyfill.registerDialog(dialog.get(0));
});

Template.roiCollectionBuilderDialogs.onCreated(() => {
  const instance = Template.instance();

  instance.data.roiCollectionBuilderActiveSeries = new ReactiveVar();
});

Template.roiCollectionBuilderDialogs.onCreated(() => {
  const instance = Template.instance();

  instance.data.selectAll = new ReactiveVar(true);
  instance.data.exportMask = [];

  instance.data.getOrCreateStructureSetCollectionData = seriesInstanceUid => {
    if (!seriesInstanceUid) {
      return;
    }

    const freehand3DStore = modules.freehand3D;
    let series = freehand3DStore.getters.series(seriesInstanceUid);

    if (!series) {
      freehand3DStore.setters.series(seriesInstanceUid);
      series = freehand3DStore.getters.series(seriesInstanceUid);
    }

    const selectAll = instance.data.selectAll.get();

    const defaultStructureSet = freehand3DStore.getters.structureSet(
      seriesInstanceUid
    );

    const ROIContourCollection = defaultStructureSet.ROIContourCollection;

    const dataArray = [];

    for (let i = 0; i < ROIContourCollection.length; i++) {
      if (
        !ROIContourCollection[i] ||
        ROIContourCollection[i].numPolygons === 0
      ) {
        continue;
      }

      dataArray.push({
        index: i,
        ROIContourReference: ROIContourCollection[i],
        structureSetReference: defaultStructureSet,
        exportMask: instance.data.exportMask,
        checked: new ReactiveVar(selectAll)
      });

      instance.data.exportMask[i] = selectAll ? true : false;
    }

    return dataArray;
  };
});

Template.roiCollectionBuilderDialogs.helpers({
  selectAllChecked: () => {
    const instance = Template.instance();
    const selectAll = instance.data.selectAll.get();

    if (selectAll) {
      return "checked";
    }

    return;
  },
  regions: () => {
    const instance = Template.instance();

    console.log("regions recalc roiCollectionBuilder");

    const seriesInstanceUid = instance.data.roiCollectionBuilderActiveSeries.get();

    // Reset the export Array
    instance.data.exportMask = [];
    const volumeData = instance.data.getOrCreateStructureSetCollectionData(
      seriesInstanceUid
    );

    return volumeData;
  }
});

Template.roiCollectionBuilderDialogs.events({
  "click .js-select-all-check"(event) {
    const instance = Template.instance();
    const checked = event.target.checked;

    instance.data.selectAll.set(checked);
  }
});