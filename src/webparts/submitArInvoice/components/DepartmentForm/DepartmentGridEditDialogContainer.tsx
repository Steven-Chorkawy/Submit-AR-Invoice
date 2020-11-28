import * as React from 'react';
import * as ReactDom from 'react-dom';

import { sp } from "@pnp/sp";

import { Dialog } from '@progress/kendo-react-dialogs';
import { Form, FormElement, Field, FieldArray } from '@progress/kendo-react-form';
import { Button } from '@progress/kendo-react-buttons';
import { Card, CardTitle, CardBody } from '@progress/kendo-react-layout';
import { filterBy } from '@progress/kendo-data-query';
import { Label } from '@progress/kendo-react-labels';

import * as MyFormComponents from '../MyFormComponents';
import * as MyValidators from '../validators.jsx';
import { GLAccountsListViewComponent } from '../MyFinanceGLAccounts';
import { MyAttachmentComponent } from '../MyAttachmentComponent';
import { ActionStepsComponent } from '../ActionStepsComponent';
import { GetDepartments } from '../MyHelperMethods';

import { IInvoiceItem } from '../interface/MyInterfaces';
import { MyLists } from '../enums/MyLists';

interface IDepartmentGridEditDialogContainerState {
  productInEdit: IInvoiceItem;
  customerList: any;
  receivedCustomerList: any;
  MiscCustomerDetails?: any;
  loading?: boolean;
  standardTerms: Array<any>;
  departments: any[];
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
        >Save</Button>
        <Button
          style={{ width: '50%' }}
          className="k-button"
          onClick={cancel}
          icon="cancel"
        >Cancel</Button>
      </div>
    </div>
  );
}

export class DepartmentGridEditDialogContainer extends React.Component<any, IDepartmentGridEditDialogContainerState> {
  constructor(props) {
    super(props);
    this.state = {
      productInEdit: {
        ...this.props.dataItem,
      },
      customerList: this.props.customers,
      receivedCustomerList: this.props.customers,
      standardTerms: [],
      departments: this.props.departments ? [...this.props.departments] : []
    };

    sp.web.lists.getByTitle(MyLists["AR Invoice Requests"]).fields
      .getByInternalNameOrTitle('Standard_x0020_Terms')
      .select('Choices')
      .get()
      .then(res => {
        this.setState({
          standardTerms: res['Choices']
        });
      });


    if (!this.props.departments) {
      GetDepartments().then(value => {
        debugger;
        this.setState({
          departments: [...value]
        });
      });
    }
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
    this.props.cancel();
    this.forceUpdate();
  }

  public render() {
    return (
      <Dialog onClose={this.props.cancel} title={"Edit AR Invoice Request"} minWidth="200px" width="80%" height="80%">
        <Form
          onSubmit={this.props.onSubmit}
          initialValues={{ ...this.state.productInEdit }}
          render={(formRenderProps) => (
            <FormElement>
              {GridButtons({ cancel: this.props.cancel, saveResult: this.props.saveResult })}
              <div className={'row'}>
                <div className={'col-sm-6'}>
                  <div style={{ display: 'block', justifyContent: 'space-between' }}>
                    <Field
                      id="Requested_x0020_By"
                      name="Requested_x0020_By"
                      label="Requested By"
                      wrapperStyle={{ width: '100%' }}
                      context={this.props.context}
                      userId={this.state.productInEdit.Requested_x0020_ById}
                      component={MyFormComponents.FormPersonaDisplay}
                    />
                    <Field
                      id="Department"
                      name="Department"
                      label="* Department"
                      wrapperStyle={{ width: '100%' }}
                      data={this.state.departments ? this.state.departments : []}
                      component={MyFormComponents.FormDropDownList}
                    />
                    <Field
                      id={'Date'}
                      name={'Date'}
                      label={'* Date'}
                      component={MyFormComponents.FormDatePicker}
                      validator={MyValidators.dateValidator}
                      wrapperStyle={{ width: '100%' }}
                    />
                    <Field
                      id="Urgent"
                      name="Urgent"
                      label="Urgent"
                      onLabel="Yes"
                      offLabel="No"
                      labelPlacement={'before'}
                      component={MyFormComponents.FormCheckbox}
                    />
                  </div>
                </div>
                <div className={'col-sm-6'}>
                  <Label>Approval Requests</Label>
                  <ActionStepsComponent actions={this.props.dataItem.Actions} onAddNewApproval={this.props.onAddNewApproval} />
                </div>
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
              <div>
                {
                  formRenderProps.valueGetter('Customer') !== null &&
                  'ID' in formRenderProps.valueGetter('Customer') === false &&
                  <Field
                    id={'MiscCustomerDetails'}
                    name={'MiscCustomerDetails'}
                    label={'Enter Additional Customer Details'}
                    placeholder={'Address, Postal Code, Contact, etc....'}
                    component={MyFormComponents.FormTextArea}
                  />
                }
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Field
                  id="Customer_x0020_PO_x0020_Number"
                  name="Customer_x0020_PO_x0020_Number"
                  label="Customer PO Number"
                  component={MyFormComponents.FormInput}
                />

                <Field
                  id="StandardTerms"
                  name="StandardTerms"
                  label="Standard Terms"
                  wrapperStyle={{ width: '50%', marginRight: '18px' }}
                  defaultValue='NET 30, 1% INTEREST CHARGED'
                  data={this.state.standardTerms}
                  component={MyFormComponents.FormDropDownList}
                />
              </div>
              <Field
                id="Invoice_x0020_Details"
                name="Invoice_x0020_Details"
                label="Invoice Details"
                component={MyFormComponents.FormTextArea}
              />
              <div style={{ width: '100%' }}>
                <FieldArray
                  name="GLAccounts"
                  component={GLAccountsListViewComponent}
                  updateAccountDetails={this.props.updateAccountDetails}
                  productInEdit={this.state.productInEdit}
                  value={this.state.productInEdit.AccountDetails}
                />
              </div>

              <hr />

              <MyAttachmentComponent
                id="RelatedAttachments"
                cardTitle="Upload Related Attachments"
                boldCardTitle={true}
                productInEdit={this.state.productInEdit}
                context={this.props.context}
                documentLibrary={MyLists["Related Invoice Attachments"]}
                onAdd={this.props.onRelatedAttachmentAdd}
                onRemove={this.props.onRelatedAttachmentRemove}
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
