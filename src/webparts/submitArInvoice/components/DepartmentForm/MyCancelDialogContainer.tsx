
import * as React from 'react';
import * as ReactDom from 'react-dom';

import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { Input, NumericTextBox } from '@progress/kendo-react-inputs';
import { Form, FormElement, Field, FieldArray } from '@progress/kendo-react-form';
import { Button } from '@progress/kendo-react-buttons';
import { Card, CardTitle, CardSubtitle, CardBody, CardActions } from '@progress/kendo-react-layout';



interface IMyEditDialogContainerProps {
  dataItem: any;
  cancel: any;
  save: any;
}


export class MyCancelDialogContainer extends React.Component<IMyEditDialogContainerProps, any> {
  /**
   *
   */
  constructor(props) {
    super(props);

    this.state = {
      productInCancel: this.props.dataItem
    };
  }

  onDialogInputChange = (event) => {
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

  public render() {
    return (
      <Dialog onClose={this.props.cancel} title={"Cancel AR Invoice Request"} minWidth="200px" width="40%">
        <h4>Enter Cancel Comment</h4>
        <textarea style={{width:'100%'}} id={'CancelComment'} onChange={this.onDialogInputChange}></textarea>
        <DialogActionsBar>
          <button
            className="k-button k-primary"
            onClick={this.props.save}
          >Send Cancel Request</button>
          <button
            className="k-button"
            onClick={this.props.cancel}
          >Cancel</button>
        </DialogActionsBar>
      </Dialog>
    );
  }

}
