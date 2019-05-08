import React from "react";
import GeneralAnatomyList from "../../../../lib/GeneralAnatomylist.js";
import { cornerstone, cornerstoneTools } from "meteor/ohif:cornerstone";

const brushModule = cornerstoneTools.store.modules.brush;

const categories = GeneralAnatomyList.SegmentationCodes.Category;

const validIcon = "fa fa-check fa-2x";
const invalidIcon = "fa fa-times fa-2x";

const validColor = "limegreen";
const invalidColor = "firebrick";

export default class BrushMetadataDialog extends React.Component {
  constructor(props = {}) {
    super(props);

    console.log(`=== BrushMetadataDialog constructor ===`);
    console.log(this.props.metadata);

    let categoryUID = "T-D0050";
    let typeUID = "T-D0050";
    let modifierUID = null;

    if (this.props.metadata) {
      const metadata = this.props.metadata;

      this._maskName = metadata.SegmentLabel;

      categoryUID = metadata.SegmentedPropertyCategoryCodeSequence.CodeValue;
      typeUID = metadata.SegmentedPropertyTypeCodeSequence.CodeValue;

      if (
        metadata.SegmentedPropertyTypeCodeSequence
          .SegmentedPropertyTypeModifierCodeSequence
      ) {
        modifierUID =
          metadata.SegmentedPropertyTypeCodeSequence
            .SegmentedPropertyTypeModifierCodeSequence.CodeValue;
      }
    } else {
      this._maskName = "";
    }

    // TODO -> populate the state if metadat is passed in through props.

    this.state = {
      validName: false,
      validType: false,
      categoryUID,
      typeUID,
      modifierUID
    };

    this.onCancelButtonClick = this.onCancelButtonClick.bind(this);
    this.onConfirmButtonClick = this.onConfirmButtonClick.bind(this);
    this.onTextInputChange = this.onTextInputChange.bind(this);
    this.onCategoryChange = this.onCategoryChange.bind(this);
    this.onTypeChange = this.onTypeChange.bind(this);
    this.onModifierChange = this.onModifierChange.bind(this);

    this._validLabelIndicator = this._validLabelIndicator.bind(this);
    this._isValidInput = this._isValidInput.bind(this);
    this._confirmButtonClasses = this._confirmButtonClasses.bind(this);
    this._segmentColor = this._segmentColor.bind(this);
    this._closeDialog = this._closeDialog.bind(this);

    console.log(`========================================`);
  }

  onTextInputChange(evt) {
    const { validName } = this.state;

    const name = evt.target.value;

    console.log(evt.target.value);

    this._maskName = name;

    if (name.length > 0 && !validName) {
      this.setState({ validName: true });
    } else if (name.length === 0 && validName) {
      this.setState({ validName: false });
    }
  }

  onCategoryChange(evt) {
    console.log(evt.target.value);

    const categoryUID = evt.target.value;

    const category = categories.find(
      categoriesI => categoriesI.CodeValue === categoryUID
    );
    const firstType = category.Type[0];

    const typeUID = firstType.CodeValue;

    let modifierUID = null;

    if (firstType.Modifier) {
      modifierUID = firstType.Modifier[0].CodeValue;
    }

    console.log(categoryUID, typeUID, modifierUID);

    this.setState({ categoryUID, typeUID, modifierUID });
  }

  onTypeChange(evt) {
    const { categoryUID } = this.state;
    console.log(evt.target.value);

    const typeUID = evt.target.value;

    const category = categories.find(
      categoriesI => categoriesI.CodeValue === categoryUID
    );

    const types = category.Type;
    const type = types.find(typesI => typesI.CodeValue === typeUID);

    let modifierUID = null;

    if (type.Modifier) {
      modifierUID = type.Modifier[0].CodeValue;
    }

    console.log(typeUID, modifierUID);

    this.setState({ typeUID, modifierUID });
  }

  onModifierChange(evt) {
    console.log(evt.target.value);

    const modifierUID = evt.target.value;

    this.setState({ modifierUID });
  }

  onCancelButtonClick() {
    console.log(`onCancelButtonClick`);

    this.props.callback(null);

    this._closeDialog();
  }

  onConfirmButtonClick() {
    const { categoryUID, typeUID, modifierUID } = this.state;

    console.log(`onConfirmButtonClick`);

    const data = {
      label: this._maskName,
      categoryUID,
      typeUID,
      modifierUID
    };

    this.props.callback(data);
    this._closeDialog();
  }

  _closeDialog() {
    const dialog = document.getElementById("brushMetadataDialog");

    dialog.close();
  }

  _validLabelIndicator() {
    if (this._isValidInput()) {
      return {
        iconClasses: `${validIcon} brush-metadata-validity-indicator`,
        color: validColor
      };
    }

    return {
      iconClasses: `${invalidIcon} brush-metadata-validity-indicator`,
      color: invalidColor
    };
  }

  _isValidInput() {
    return this._maskName.length > 0;
  }

  _confirmButtonClasses() {
    if (this._isValidInput()) {
      return "brush-metadata-new-button btn btn-sm btn-primary";
    }

    return "brush-metadata-new-button-invalid btn btn-sm btn-primary";
  }

  _segmentColor() {
    const { segIndex } = this.props;

    const colormap = cornerstone.colors.getColormap(
      brushModule.state.colorMapId
    );

    if (!colormap) {
      return;
    }
    const colorArray = colormap.getColor(segIndex);

    return `rgba(
      ${colorArray[[0]]}, ${colorArray[[1]]}, ${colorArray[[2]]}, 1.0
    )`;
  }

  render() {
    const { segIndex, defaultName } = this.props;
    const { categoryUID, typeUID, modifierUID } = this.state;

    const segmentIndexText = `Segment ${segIndex}`; // TODO write segIndex + 1 once working.

    const validLabelIndicator = this._validLabelIndicator();

    const categorySelect = (
      <>
        <label>Category</label>
        <select
          className="form-themed form-control"
          onChange={this.onCategoryChange}
          value={categoryUID}
        >
          {categories.map(category => (
            <option key={category.CodeValue} value={category.CodeValue}>
              {category.CodeMeaning}
            </option>
          ))}
        </select>
      </>
    );

    console.log(`categories:`);
    console.log(categories);

    const category = categories.find(
      categoriesI => categoriesI.CodeValue === categoryUID
    );
    const types = category.Type;

    console.log("types:");
    console.log(types);

    const typeSelect = (
      <>
        <label>Type</label>
        <select
          className="form-themed form-control"
          onChange={this.onTypeChange}
          value={typeUID}
        >
          {types.map(type => (
            <option key={type.CodeValue} value={type.CodeValue}>
              {type.CodeMeaning}
            </option>
          ))}
        </select>
      </>
    );

    // TODO -> Type not changing on select.

    const type = types.find(typesI => typesI.CodeValue === typeUID);

    console.log(`type`);
    console.log(type);

    let modifierSelect;

    if (type.Modifier) {
      const modifiers = type.Modifier;

      modiferSelect = (
        <>
          <label>Modifier</label>
          <select
            className="form-themed form-control"
            onChange={this.onModifierChange}
            value={modifierUID}
          >
            {modifiers.map(modifier => (
              <option key={modifier.CodeValue} value={modifier.CodeValue}>
                {modifier.CodeMeaning}
              </option>
            ))}
          </select>
        </>
      );
    }

    return (
      <div>
        <div className="brush-metadata-horizontal-box">
          <h3 style={{ border: `2px solid ${this._segmentColor()}` }}>
            {segmentIndexText}
          </h3>
          <a
            className="btn btn-sm btn-secondary"
            onClick={this.onCancelButtonClick}
          >
            <i className="fa fa-times-circle fa-2x" />
          </a>
        </div>

        <hr />

        <div className="brush-metadata-vert-box">
          <label htmlFor="brushMetadataLabelInput">Label</label>

          <div className="brush-metadata-horizontal-box">
            <input
              name="brushMetadataLabelInput"
              className="brush-metadata-input brush-metadata-label-input form-themed form-control"
              onChange={this.onTextInputChange}
              type="text"
              autoComplete="off"
              defaultValue={defaultName}
              placeholder="Enter Segmentation Label.."
              tabIndex="1"
            />
            <i
              className={validLabelIndicator.iconClasses}
              style={{ color: validLabelIndicator.color }}
            />
          </div>

          <div>
            {categorySelect}
            {typeSelect}
            {type.Modifier && modiferSelect}
          </div>
        </div>

        <hr />
        <a
          className={this._confirmButtonClasses()}
          onClick={this.onConfirmButtonClick}
        >
          <i className="fa fa fa-check-circle fa-2x" />
        </a>
      </div>
    );
  }
}