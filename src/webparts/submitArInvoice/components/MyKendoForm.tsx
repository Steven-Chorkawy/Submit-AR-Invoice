import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Form, Field, FormElement, FieldWrapper, FieldArray } from '@progress/kendo-react-form';
import { Button } from '@progress/kendo-react-buttons';
import { Card, CardTitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { filterBy } from '@progress/kendo-data-query';

import { sp } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/items";

import * as MyFormComponents from './MyFormComponents';
import { IMyFormProps } from './IMyFormProps';
import { IUploadingFile } from './IMyFormState';
import * as MyValidators from './validators.jsx';
import { MyGLAccountComponent } from './MyGLAccountComponent';
import { BuildGUID, ConvertQueryParamsToKendoFilter } from './MyHelperMethods';
import { MyLists } from './enums/MyLists';
import { IItemAddResult } from '@pnp/sp/items';
import { IInvoiceActionRequired, InvoiceActionRequiredRequestType } from '../components/interface/IInvoiceActionRequired';
import { InvoiceActionResponseStatus } from './enums/MyEnums';



export interface IARFormModel {
  Title: string;
  Department: string;
  Date: Date;
  Requested_x0020_ById: number;
  Requires_x0020_Authorization_x0020_ById: any;
  Invoice_x0020_Details: string;
  CustomerId: number;
  Standard_x0020_Terms: string;
  Urgent: boolean;
  Customer_x0020_PO_x0020_Number: any;
}


export interface IARAccountDetails {
  AR_x0020_InvoiceId?: number;              // ID of Invoice
  ReceivedARRequestId?: number;             // ID of the incoming AR Request.
  AR_x0020_Invoice_x0020_RequestId?: number; // ID of AR Request
  Account_x0020_Code: string;               // GL Code
  Amount: number;                           // Amount for account
  HST_x0020_Taxable: boolean;               // Is amount taxable?
}

export class MyForm extends React.Component<IMyFormProps, any> {
  private _siteUrl: string;

  constructor(props) {
    super(props);

    this._siteUrl = props.ctx.pageContext.web.absoluteUrl;

    this.state = {
      MyFiles: [],
      productInEdit: {},
      stateHolder: 0,
      customerList: this.props.customerList,
      receivedCustomerList: this.props.customerList,
      ...props
    };
  }


  // TODO: Update this method so it saves in 'ReceiveARInvoiceRequest' instead of AR Invoice Requests.
  /**
   * Form Submit Event
   * @param dataItem Data from form
   */
  public handleSubmit = async (dataItem) => {
    debugger;
    // We will use this to update states later.
    let currentFiles: IUploadingFile[] = this.state.MyFiles;

    try {
      let web = Web(this._siteUrl);

      let currentYear = new Date().getFullYear();
      const newARTitle = currentYear + "-AR-" + BuildGUID();


      // Set the data for the invoice
      var myData = {
        Title: newARTitle,
        Department: dataItem.Department,
        Date: dataItem.Date,
        Requested_x0020_ById: dataItem.Requested_x0020_By.Id,
        Requires_x0020_Authorization_x0020_ById: {
          'results': dataItem.RequiresAuthorizationBy.map((user) => { return user.Id; })
        },
        //CustomerId: dataItem.Customer.Id,
        Customer_x0020_PO_x0020_Number: dataItem.CustomerPONumber,
        Invoice_x0020_Details: dataItem.InvoiceDetails,
        Standard_x0020_Terms: dataItem.StandardTerms,
        Urgent: dataItem.Urgent
      };

      // Add customer data.
      // dataItem.Customer.ID is undefined when a custom customer is added.
      if (dataItem.Customer.ID === undefined) {
        myData['MiscCustomerDetails'] = this.state.MiscCustomerDetails;
        myData['MiscCustomerName'] = dataItem.Customer.Customer_x0020_Name;
      }
      else {
        myData['CustomerId'] = dataItem.Customer.Id;
      }

      var arInvoiceRequestListItemData = {
        ...myData,
        Requires_x0020_Department_x0020_Id: myData.Requires_x0020_Authorization_x0020_ById
      };

      delete arInvoiceRequestListItemData.Requires_x0020_Authorization_x0020_ById;

      debugger;
      // * Save the AR Request to the SP List.
      let arInvoiceRequstListItem = await web.lists
        .getByTitle(MyLists.ReceiveARInvoiceRequest)
        .items.add(arInvoiceRequestListItemData);

      debugger;

      // ! This step will no longer be done here.  It will be done in a flow.
      // TODO: Delete this block of code.
      // Create an approval request.
      // For each requires approval from.
      // for (let index = 0; index < dataItem.RequiresAuthorizationBy.length; index++) {

      //   const element = dataItem.RequiresAuthorizationBy[index];
      //   let newAction: IInvoiceActionRequired = {
      //     ReceivedARRequestId: arInvoiceRequstListItem.data.ID,
      //     Title: 'Approval Required',
      //     AssignedToId: element.Id,
      //     Body: 'Approval Required',
      //     Request_x0020_Type: InvoiceActionRequiredRequestType.DepartmentApprovalRequired,
      //     Response_x0020_Status: InvoiceActionResponseStatus.Waiting
      //   };

      //   web.lists.getByTitle(MyLists.InvoiceActionRequired)
      //     .items
      //     .add(newAction);
      // }

      const accounts: IARAccountDetails = { ...dataItem.GLAccounts };

      // Add Account Codes
      dataItem.GLAccounts.map(account => {
        debugger;
        sp.web.lists.getByTitle(MyLists["AR Invoice Accounts"]).items
          .add({
            ReceivedARRequestId: arInvoiceRequstListItem.data.ID,
            Account_x0020_Code: account.GLCode,
            HST_x0020_Taxable: account.HSTTaxable,
            Amount: account.Amount
          });
      });

      // Add related items
      if (dataItem.RelatedInvoiceAttachments) {
        let relatedInvoiceAttachmentIds = [];
        for (let index = 0; index < dataItem.RelatedInvoiceAttachments.length; index++) {
          const element = dataItem.RelatedInvoiceAttachments[index];
          // TODO: Remove this hard coded URL and replace it with a config string.
          await web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/RelatedInvoiceAttachments/')
            .files
            .add(element.name, element.getRawFile(), true)
            .then(async uploadResponse => {
              await uploadResponse.file.getItem()
                .then(async item => {
                  const itemProxy: any = Object.assign({}, item);
                  // Add the AR Request ID to the attachment
                  await sp.web.lists.getByTitle(MyLists["Related Invoice Attachments"])
                    .items
                    .getById(itemProxy.ID)
                    .update({
                      ReceivedARRequestId: arInvoiceRequstListItem.data.ID,
                      Title: element.name
                    });

                  relatedInvoiceAttachmentIds.push(itemProxy.ID);
                });
            });
        }

        // !! No longer required.  This will be done in a flow.
        // Add the attachments ID to the AR Request.
        // sp.web.lists.getByTitle(MyLists["AR Invoice Requests"])
        //   .items
        //   .getById(arInvoiceRequstListItem.data.Id)
        //   .update({
        //     RelatedAttachmentsId: {
        //       results: relatedInvoiceAttachmentIds
        //     }
        //   });
      }


      // TODO: Update this message so it let's the user know they'll be receiving an email once the request has been processed.
      // Provide a success message back to the user.
      currentFiles.push({
        FileName: 'To be set',
        UploadSuccessful: true,
        ErrorMessage: null,
        LinkToFile: `${this._siteUrl}/SitePages/Department-AR-Search-Page.aspx/?FilterField1=ID&FilterValue1=${arInvoiceRequstListItem.data.ID}`
      });

      // Force a re render.
      this.setState({
        stateHolder: this.state.stateHolder + 1,
        MyFiles: currentFiles
      });

      this.forceUpdate();

    } catch (error) {

      console.log("Something went wrong!");
      console.log(error);

      currentFiles.push({
        FileName: '',
        UploadSuccessful: false,
        ErrorMessage: "Something went wrong!",
        LinkToFile: null
      });
      this.setState({
        MyFiles: currentFiles
      });

      throw error;
    }
  }

  public uploadRelatedFiles = async (inputData, mainFile) => {

    let web = Web(this._siteUrl);

    for (let index = 0; index < inputData.RelatedAttachments.length; index++) {
      const element = inputData.RelatedAttachments[index];

      let uploadRes = await web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/RelatedInvoiceAttachments/')
        .files
        .add(element.name, element.getRawFile(), true)
        .then(({ file }) => file.getItem()
          .then((item: any) => {

            return item.update({
              ARInvoiceId: mainFile.Id,
              Title: element.name
            });
          })
        );
    }
  }

  public UploadStatusCard = () => {
    let output = [];

    this.state.MyFiles.map(f => {
      output.push(
        <Card type={f.UploadSuccessful ? 'success' : 'error'} style={{ margin: '2px' }}>
          <CardBody>
            <CardTitle>
              <a href={f.LinkToFile} target='_blank'>{f.UploadSuccessful ? 'Success! - View Invoice Here' : 'Error'}</a>
            </CardTitle>
            <p>{f.ErrorMessage}</p>
          </CardBody>
        </Card>
      );
    });

    return output;
  }

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

  public render() {
    return (
      <div style={{ padding: '5px' }} key={this.state.stateHolder}>
        <Form
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
                  validator={MyValidators.departmentValidator}
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
                  id="RequiresAuthorizationBy"
                  name="RequiresAuthorizationBy"
                  label="* Requires Authorization By"
                  wrapperStyle={{ width: '50%' }}
                  data={this.props.siteUsers}
                  dataItemKey="Email"
                  textField="Title"
                  validator={MyValidators.requiresApprovalFrom}
                  component={MyFormComponents.FormMultiSelect}
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
                //onchange={this.onDialogInputChange}
                />
              </div>
              <Field
                id="Customer"
                name="Customer"
                label="* Customer"
                wrapperStyle={{ width: '100%' }}
                data={this.state.customerList}
                dataItemKey="Id"
                textField="Customer_x0020_Name"
                validator={MyValidators.requiresCustomer}
                allowCustom={true}
                itemRender={this.customerItemRender}
                component={MyFormComponents.CustomerComboBox}
                filterable={true}
                suggest={true}
                onFilterChange={this.customerFilterChange}
                onCustomCusteromChange={this.onCustomCustomerChange}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Field
                  id="CustomerPONumber"
                  name="CustomerPONumber"
                  label="Customer PO Number"
                  //validator={MyValidators.requiresCustomerPONUmber}
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
                id="InvoiceDetails"
                name="InvoiceDetails"
                label="Invoice Details"
                component={MyFormComponents.FormTextArea}
              //onchange={this.onDialogInputChange}
              />


              <div style={{ width: '100%' }} className={'k-form-field'}>
                <FieldArray
                  name="GLAccounts"
                  label="G/L Accounts"
                  component={MyGLAccountComponent}
                //onchange={this.onDialogInputChange}
                />
              </div>

              <hr />

              <Field
                id="RelatedInvoiceAttachments"
                name="RelatedInvoiceAttachments"
                label="Upload Related Attachments"
                batch={false}
                multiple={true}
                component={MyFormComponents.FormUpload}
              //onchange={this.onDialogInputChange}
              />
              <hr />

              <div className="k-form-buttons">
                <Button
                  primary={true}
                  type={'submit'}
                  icon="save"
                >Submit AR Invoice Request</Button>
                <Button onClick={formRenderProps.onFormReset}>Clear</Button>
              </div>

              {(this.state.MyFiles.length > 0) && this.UploadStatusCard()}
            </FormElement>
          )} />
      </div>
    );
  }
}

