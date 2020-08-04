import * as React from 'react';
import * as ReactDom from 'react-dom';

import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { Input, NumericTextBox } from '@progress/kendo-react-inputs';
import { Form, FormElement, Field, FieldArray } from '@progress/kendo-react-form';
import { Button } from '@progress/kendo-react-buttons';
import { Card, CardTitle, CardSubtitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { filterBy } from '@progress/kendo-data-query';

import * as MyFormComponents from '../MyFormComponents';
import * as MyValidators from '../validators.jsx';
import { MyFinanceGlAccountsComponent, MyFinanceGlAccounts } from '../MyFinanceGLAccounts';
import { MyRelatedAttachmentComponent } from '../MyRelatedAttachmentComponent';
import { ApprovalRequiredComponent } from '../ApprovalRequiredComponent';


export class MyEditDialogContainer extends React.Component<any, any> {
  constructor(props) {
    super(props);
    this.props.dataItem.Requires_x0020_Authorization_x0020_ById.map(reqAuthId => {
      this._selectedReqApprovers.push(this.props.siteUsers.find(s => s.Id === reqAuthId));
    });

    this.state = {
      productInEdit: this.props.dataItem || null,
      selectedReqApprovers: this._selectedReqApprovers,
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

    this.setState({
      MiscCustomerDetails: value
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

  public handleSubmit(event) {
    event.preventDefault();
  }

  public onDialogInputChange = (event) => {
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

  public render() {
    return (
      <Dialog onClose={this.props.cancel} title={"Edit AR Invoice Request"} minWidth="200px" width="80%" height="80%">
        <ApprovalRequiredComponent
          productInEdit={this.state.productInEdit}
          currentUser={this.props.currentUser}
        />
        <Form
          //onSubmit={this.handleSubmit}
          onSubmit={this.handleSubmit}

          initialValues={{
            Date: new Date(),
            Urgent: false,
            StandardTerms: 'NET 30, 1% INTEREST CHARGED',
            GLAccounts: [],
          }}

          render={(formRenderProps) => (
            <FormElement >

              <legend className={'k-form-legend'}>ACCOUNTS RECEIVABLE - INVOICE REQUISITION </legend>

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

                <Field
                  id={'Date'}
                  name={'Date'}
                  label={'* Date'}
                  component={MyFormComponents.FormDatePicker}
                  //validator={MyValidators.dateValidator}
                  wrapperStyle={{ width: '50%' }}
                  value={new Date(this.state.productInEdit.Date)}
                  onChange={this.onDialogInputChange}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Field
                  id="RequestedBy"
                  name="RequestedBy"
                  label="* Requested By"
                  wrapperStyle={{ width: '50%', marginRight: '18px' }}
                  data={this.props.siteUsers}
                  dataItemKey="Email"
                  textField="Title"
                  //validator={MyValidators.requestedByValidator}
                  component={MyFormComponents.FormComboBox}
                  value={this.props.siteUsers.find(s => s.Id === this.state.productInEdit.Requested_x0020_ById)}
                  onChange={this.onDialogInputChange}
                />

                <Field
                  id="RequiresAuthorizationBy"
                  name="RequiresAuthorizationBy"
                  label="* Requires Authorization By"
                  wrapperStyle={{ width: '50%' }}
                  data={this.props.siteUsers}
                  dataItemKey="Email"
                  textField="Title"
                  component={MyFormComponents.FormMultiSelect}
                  value={this.state.selectedReqApprovers}
                  onChange={this.onDialogInputChange}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Field
                  id="Urgent"
                  name="Urgent"
                  label="Urgent"
                  onLabel="Yes"
                  offLabel="No"
                  component={MyFormComponents.FormSwitch}
                  defaultChecked={this.state.productInEdit.Urgent}
                  onChange={this.onDialogInputChange}
                />
              </div>
              <Field
                id="Customer"
                name="Customer"
                label="* Customer"
                wrapperStyle={{ width: '100%' }}
                data={this.state.customerList}
                dataItemKey="ID"
                textField="Customer_x0020_Name"
                validator={MyValidators.requiresCustomer}
                allowCustom={true}
                itemRender={this.customerItemRender}
                component={MyFormComponents.CustomerComboBox}
                filterable={true}
                suggest={true}
                onFilterChange={this.customerFilterChange}
                onCustomCusteromChange={this.onCustomCustomerChange}
                value={
                  this.state.productInEdit.CustomerId === null
                    ? this.state.productInEdit.Customer
                    : this.props.customers.find(f => f.Id === this.state.productInEdit.CustomerId)
                }
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Field
                  id="CustomerPONumber"
                  name="CustomerPONumber"
                  label="Customer PO Number"
                  ////validator={MyValidators.requiresCustomerPONUmber}
                  component={MyFormComponents.FormInput}
                  value={this.state.productInEdit.Customer_x0020_PO_x0020_Number}
                  onChange={this.onDialogInputChange}
                />

                <Field
                  id="StandardTerms"
                  name="StandardTerms"
                  label="Standard Terms"
                  wrapperStyle={{ width: '50%', marginRight: '18px' }}
                  defaultValue='NET 30, 1% INTEREST CHARGED'
                  data={[
                    'NET 30, 1% INTEREST CHARGED'
                  ]}
                  component={MyFormComponents.FormDropDownList}
                  onChange={this.onDialogInputChange}
                />
              </div>

              <Field
                id="Comment"
                name="Comment"
                label="Comments"
                value={this.state.productInEdit.Comment}
                component={MyFormComponents.FormTextArea}
                onChange={this.onDialogInputChange}
              />

              <Field
                id="InvoiceDetails"
                name="InvoiceDetails"
                label="Invoice Details"
                component={MyFormComponents.FormTextArea}
                value={this.state.productInEdit.Invoice_x0020_Details}
                onChange={this.onDialogInputChange}
              />

              <div style={{ width: '100%' }}>
                <FieldArray
                  name="GLAccounts"
                  component={MyFinanceGlAccountsComponent}
                  value={this.state.productInEdit.AccountDetails}
                />
              </div>

              <hr />
              <MyRelatedAttachmentComponent
                productInEdit={this.state.productInEdit}
                onChange={this.onDialogInputChange}
              />
            </FormElement>
          )} />
        <DialogActionsBar>
          <button
            className="k-button k-primary"
            onClick={this.props.save}
          >Save</button>
          <button
            className="k-button"
            onClick={this.props.cancel}
          >Cancel</button>
        </DialogActionsBar>
      </Dialog>
    );
  }
}
