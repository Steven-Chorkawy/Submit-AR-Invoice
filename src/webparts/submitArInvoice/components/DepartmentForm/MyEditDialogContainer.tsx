import * as React from 'react';
import * as ReactDom from 'react-dom';

import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { Input, NumericTextBox } from '@progress/kendo-react-inputs';
import { Form, FormElement, Field, FieldArray } from '@progress/kendo-react-form';
import { Button } from '@progress/kendo-react-buttons';
import { Card, CardTitle, CardSubtitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { filterBy } from '@progress/kendo-data-query';
import { Label, Error, Hint, FloatingLabel } from '@progress/kendo-react-labels';
import { FieldWrapper } from '@progress/kendo-react-form';
import { DropDownList, AutoComplete, MultiSelect, ComboBox } from '@progress/kendo-react-dropdowns';


import * as MyFormComponents from '../MyFormComponents';
import * as MyValidators from '../validators.jsx';
import { MyFinanceGlAccountsComponent, MyFinanceGlAccounts } from '../MyFinanceGLAccounts';
import { MyRelatedAttachmentComponent } from '../MyRelatedAttachmentComponent';
import { ApprovalRequiredComponent } from '../ApprovalRequiredComponent';
import { IInvoiceItem } from '../interface/InvoiceItem';
import { InvoiceActionRequiredResponseStatus } from '../interface/IInvoiceActionRequired';

interface IMyEditDialogContainerState {
  productInEdit: IInvoiceItem;
  selectedReqApprovers: any;
  selectedCustomer: any;
  customerList: any;
  receivedCustomerList: any;
  MiscCustomerDetails?: any;
  loading?: boolean;
}

function GridButtons(props) {
  return <div className="k-form-buttons">
    <Button
      type={"submit"}
      style={{ width: '50%' }}
      className="k-button k-primary"
      icon="save"
    // disabled={!formRenderProps.allowSubmit}
    >Save</Button>
    <Button
      // type={"submit"}
      style={{ width: '50%' }}
      className="k-button"
      onClick={props.cancel}
      icon="cancel"
    >Cancel</Button>
  </div>;
}

export class MyEditDialogContainer extends React.Component<any, IMyEditDialogContainerState> {
  constructor(props) {
    super(props);
    console.log("MyEditDialogContainer");
    console.log(props);


    if (this.props.dataItem.Requires_x0020_Authorization_x0020_ById) {
      this.props.dataItem.Requires_x0020_Authorization_x0020_ById.map(reqAuthId => {
        this._selectedReqApprovers.push(this.props.siteUsers.find(s => s.Id === reqAuthId));
      });
    }
    else if (this.props.dataItem.Requires_x0020_Department_x0020_Id) {
      this.props.dataItem.Requires_x0020_Department_x0020_Id.map(reqAuthId => {
        this._selectedReqApprovers.push(this.props.siteUsers.find(s => s.Id === reqAuthId));
      });
    }

    this.state = {
      productInEdit: this.props.dataItem || null,
      selectedReqApprovers: this._selectedReqApprovers,
      selectedCustomer: this.props.dataItem.Customer,
      customerList: this.props.customers,
      receivedCustomerList: this.props.customers
    };
    this._selectedReqApprovers = [];
  }

  private _selectedReqApprovers = [];

  //#region Customer Component Methods
  private customerItemRender = (li, itemProps) => {
    const index = itemProps.index;
    const itemChildren = <span>{itemProps.dataItem.Customer_x0020_Name} | {itemProps.dataItem.WorkAddress}</span>;

    return React.cloneElement(li, li.props, itemChildren);
  }
  public onCustomCustomerChange = (event) => {

    let target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    debugger;

    let customer = {
      ...this.state.productInEdit.Customer,
      CustomerDetails: value
    };

    let edited = this.state.productInEdit;
    edited.Customer = customer;

    this.setState({
      productInEdit: edited
    });
  }

  public customerFilterChange = (event) => {
    setTimeout(() => {
      this.setState({
        customerList: this.filterData(event.filter),
        loading: false
      });
    }, 500);
  }

  public filterData(filter) {
    const data = this.state.receivedCustomerList.slice();
    return filterBy(data, filter);
  }
  //#endregion

  public onDialogInputChange = (event) => {
    debugger;
    let target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    let name = (target.props && target.props.name !== undefined) ? target.props.name : (target.name !== undefined) ? target.name : target.props.id;

    // last chance.
    if (name === "" && target.id !== undefined) {
      name = target.id;
    }

    switch (name) {
      case 'RequestedBy':
        name = 'Requested_x0020_ById';
        value = value.Id;
        break;
      case 'RequiresAuthorizationBy':
        name = 'Requires_x0020_Authorization_x0020_ById';
        // Clear temp variable.
        this._selectedReqApprovers = [];
        // map each selected user into the temp variable.
        value.map(user => {
          this._selectedReqApprovers.push(this.props.siteUsers.find(s => s.Id === user.Id));
        });
        // Set the whole users object in the state which is used by the dropdown.
        this.setState({
          selectedReqApprovers: this._selectedReqApprovers
        });
        break;
      case 'Customer':
        name = 'CustomerId';
        value = value.Id;
        this.setState({
          selectedCustomer: {
            Customer_x0020_Name: value.Customer_x0020_Name,
            ID: value.Id
          }
        });
        break;
      case 'CustomerPONumber':
        name = 'Customer_x0020_PO_x0020_Number';
        break;
      case 'InvoiceDetails':
        name = 'Invoice_x0020_Details';
        break;
      default:
        break;
    }

    const edited = this.state.productInEdit;
    edited[name] = value;

    this.setState({
      productInEdit: edited
    });
  }

  public onActionResponseSent = (e) => {
    console.log('before update');
    console.log(this.state.productInEdit.Actions);
    this.forceUpdate();
  }


  public render() {
    return (
      <Dialog onClose={this.props.cancel} title={"Edit AR Invoice Request"} minWidth="200px" width="80%" height="80%">

        {
          this.state.productInEdit.Actions
            .filter(f => f.AuthorId === this.props.currentUser.Id && f.Response_x0020_Status === InvoiceActionRequiredResponseStatus.Waiting)
            .map(action => {
              return (<ApprovalRequiredComponent
                action={action}
                productInEdit={this.state.productInEdit}
                currentUser={this.props.currentUser}
                onActionSentCallBack={this.onActionResponseSent}
              />);
            })
        }

        <Form
          onSubmit={this.props.onSubmit}
          initialValues={{ ...this.state.productInEdit }}
          render={(formRenderProps) => (
            <FormElement>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Field
                  id="Department"
                  name="Department"
                  label="* Department"
                  wrapperStyle={{ width: '50%', marginRight: '18px' }}
                  data={[
                    'Administration',
                    'Clerks Department',
                    'Community Service',
                    'Corporate Services Department',
                    'Emergency Services',
                    'Engineering Services',
                    'Finance',
                    'Legal Services Department',
                    'Mayor & Council',
                    'Operations',
                    'Planning Services'
                  ]}
                  //validator={MyValidators.departmentValidator}
                  component={MyFormComponents.FormDropDownList}
                  value={this.state.productInEdit.Department}
                  onChange={this.onDialogInputChange}
                />
                <div className="k-form-buttons">
                  <button
                    type={"submit"}
                    className="k-button k-primary"
                  >Save</button>
                  <button
                    type={"submit"}
                    className="k-button"
                    onClick={this.props.cancel}
                  >Cancel</button>
                </div>
              </div>
            </FormElement>
          )}
        >
        </Form>
      </Dialog>
    );
  }
}
