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
  customerList: any;
  receivedCustomerList: any;
  MiscCustomerDetails?: any;
  loading?: boolean;
}

function GridButtons({ cancel, saveResult }) {
  return (
    <div>
      {saveResult && saveResult.success === false &&
        <div>
          <Card style={{ width: 600 }} type={'error'}>
            <CardBody>
              <CardTitle>Something went wrong!</CardTitle>
              <hr />
              <p>{saveResult.message}</p>
            </CardBody>
          </Card>
        </div>}
      <div className="k-form-buttons">
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
          onClick={cancel}
          icon="cancel"
        >Cancel</Button>
      </div>
    </div>
  );
}

export class MyEditDialogContainer extends React.Component<any, IMyEditDialogContainerState> {
  constructor(props) {
    super(props);
    this.state = {
      productInEdit: {
        ...this.props.dataItem,
      },
      customerList: this.props.customers,
      receivedCustomerList: this.props.customers
    };
  }



  //#region Customer Component Methods
  private customerItemRender = (li, itemProps) => {
    const index = itemProps.index;
    const itemChildren = <span>{itemProps.dataItem.Customer_x0020_Name} | {itemProps.dataItem.WorkAddress}</span>;

    return React.cloneElement(li, li.props, itemChildren);
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


  public onActionResponseSent = (e) => {
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
              {GridButtons({ cancel: this.props.cancel, saveResult: this.props.saveResult })}
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
                  component={MyFormComponents.FormDropDownList}
                />
                <Field
                  id={'Date'}
                  name={'Date'}
                  label={'* Date'}
                  component={MyFormComponents.FormDatePicker}
                  validator={MyValidators.dateValidator}
                  wrapperStyle={{ width: '50%' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Field
                  id="Requested_x0020_By"
                  name="Requested_x0020_By"
                  label="* Requested By"
                  wrapperStyle={{ width: '50%', marginRight: '18px' }}
                  data={this.props.siteUsers}
                  dataItemKey="Email"
                  textField="Title"
                  validator={MyValidators.requestedByValidator}
                  component={MyFormComponents.FormComboBox}
                />

                <Field
                  id="Requires_x0020_Department_x0020_"
                  name="Requires_x0020_Department_x0020_"
                  label="* Requires Authorization By"
                  wrapperStyle={{ width: '50%' }}
                  data={this.props.siteUsers}
                  dataItemKey="Email"
                  textField="Title"
                  component={MyFormComponents.FormMultiSelect}
                  validator={MyValidators.requiresApprovalFrom}
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
                />
              </div>

              <Field
                id="Customer"
                name="Customer"
                label="* Customer"
                wrapperStyle={{ width: '100%' }}
                data={this.state.customerList}
                textField="Customer_x0020_Name"
                validator={MyValidators.requiresCustomer}
                allowCustom={true}
                itemRender={this.customerItemRender}
                component={MyFormComponents.CustomerComboBox}
                onCustomCustomerChange={this.props.onCustomCustomerChange}
                filterable={true}
                suggest={true}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Field
                  id="CustomerPONumber"
                  name="CustomerPONumber"
                  label="Customer PO Number"
                  component={MyFormComponents.FormInput}
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
                />
              </div>

              <Field
                id="Comment"
                name="Comment"
                label="Comments"
                value={this.state.productInEdit.Comment}
                component={MyFormComponents.FormTextArea}
              />

              <Field
                id="InvoiceDetails"
                name="InvoiceDetails"
                label="Invoice Details"
                component={MyFormComponents.FormTextArea}
                value={this.state.productInEdit.Invoice_x0020_Details}
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
              />

              {GridButtons({ cancel: this.props.cancel, saveResult: this.props.saveResult })}
            </FormElement>
          )}
        >
        </Form>
      </Dialog >
    );
  }
}
