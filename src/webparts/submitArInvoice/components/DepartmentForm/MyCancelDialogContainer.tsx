
import * as React from 'react';
import * as ReactDom from 'react-dom';

// Kendo Imports
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';

// Fluent UI Imports
import { Panel, PanelType, PrimaryButton, DefaultButton, Dropdown, TextField, IDropdownOption, Label } from '@fluentui/react';

interface IMyEditDialogContainerProps {
  dataItem: any;
  cancel: any;
  save: any;
}

const buttonStyles = { root: { marginRight: 8 } };

export class MyCancelDialogContainer extends React.Component<IMyEditDialogContainerProps, any> {
  constructor(props) {
    super(props);

    this.state = {
      productInCancel: this.props.dataItem
    };
  }

  public onDialogInputChange = (event) => {
    let target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    let name = (target.props && target.props.name !== undefined) ? target.props.name : (target.name !== undefined) ? target.name : target.props.id;

    // last chance.
    if (name === "" && target.id !== undefined) {
      name = target.id;
    }
    const edited = this.state.productInCancel;
    edited[name] = value;

    this.setState({
      productInCancel: edited
    });
  }

  //#region Render Methods
  private onRenderFooterContent = (props) => (
    <div>
      <PrimaryButton onClick={this.props.save} styles={buttonStyles}>Save</PrimaryButton>
      <DefaultButton onClick={this.props.cancel}>Cancel</DefaultButton>
    </div>
  )
  //#endregion

  public render() {
    return (
      <Panel
        isOpen={true}
        onDismiss={this.props.cancel}
        type={PanelType.medium}
        closeButtonAriaLabel="Close"
        headerText="Submit Cancel Request"
        onRenderFooterContent={this.onRenderFooterContent}
        isFooterAtBottom={true}
      >
        <Label>Comment for Cancel Request</Label>
        <textarea style={{ width: '100%' }} id={'CancelComment'} onChange={this.onDialogInputChange}></textarea>
      </Panel>
    );
  }
}
