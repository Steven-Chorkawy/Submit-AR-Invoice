import * as React from 'react';
import * as ReactDom from 'react-dom';

// Kendo Imports
import { Form, Field, FormElement, FieldWrapper, FieldArray } from '@progress/kendo-react-form';
import { Button } from '@progress/kendo-react-buttons';
import { Card, CardTitle, CardBody, CardActions, CardSubtitle } from '@progress/kendo-react-layout';
import { filterBy } from '@progress/kendo-data-query';
import { Label } from '@progress/kendo-react-labels';

// PNP Imports
import { sp } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/profiles";

// Office UI & MS Imports Imports
import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { Shimmer } from 'office-ui-fabric-react/lib/Shimmer';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';

// My custom imports
import * as MyFormComponents from './MyFormComponents';
import { IUploadingFile } from './IMyFormState';
import * as MyValidators from './validators.jsx';
import { MyGLAccountComponent } from './MyGLAccountComponent';
import { BuildGUID, GetUserByEmail, GetUserById, GetUserByLoginName, GetUsersByLoginName, GetUserProfile, GetDepartments, GetStandardTerms } from './MyHelperMethods';
import './PersonaComponent';
import { MyLists } from './enums/MyLists';

export interface ICreateARInvoiceFormProps {
    siteUsers: any;
    customerList: any;
    context: any;
    properties: any;
}

export interface ICreateARInvoiceFormState {
    context: any;
    properties: any;
    siteUsers?: any[];
    customerList?: any[];
    receivedCustomerList?: any[];
    departments?: any[];
    Standard_x0020_Terms?: any[];
    saveRunning: boolean;
    currentUser?: any;
    errorMessage?: string;
    formKey: number;
}

export class CreateARInvoiceForm extends React.Component<ICreateARInvoiceFormProps, ICreateARInvoiceFormState> {
    constructor(props) {
        super(props);

        // Current user will be used to set default values on the form. 
        sp.web.currentUser.get().then(user => {
            GetUserProfile(user.LoginName, e => {
                this.setState({
                    currentUser: e
                });
            });
        });

        // Get a list of the departments. This is used to populate the department dropdown list.
        GetDepartments().then(value => {
            this.setState({ departments: value });
        });

        // Get a list of Standard Terms.  This is used to populate the list of Standard Terms. 
        GetStandardTerms().then(value => {
            this.setState({ Standard_x0020_Terms: value });
        });

        this.state = {
            ...this.props,
            context: this.props.context,
            properties: this.props.properties,
            receivedCustomerList: this.props.customerList,
            saveRunning: false,
            formKey: 0
        };
    }

    //#region Form Submit Method
    /**
     * Checks if the user has entered a Misc customer or if they've selected one from the list.
     * @param dataItem Object from that was sent from the form.
     * @returns dataItem without the Customer property.
     */
    private parseCustomerData = dataItem => {
        let myData = { ...dataItem };

        // Before we can save this invoice we must first parse the customer data from the form. 
        if (myData.Customer.ID === undefined) {
            // If there is no customer ID that means there is misc customer. 
            myData['MiscCustomerName'] = myData.Customer.Customer_x0020_Name;
        }
        else {
            myData['CustomerId'] = myData.Customer.ID;
        }

        delete myData.Customer;

        return myData;
    }

    /**
     * Creates an AR Invoice record and sets the permissions.  
     * @param dataItem Value from the forms submit event.
     */
    private triggerARInvoiceWorkflow = async (dataItem: any): Promise<number> => {
        const WORKFLOW_API_URL = 'https://prod-27.canadacentral.logic.azure.com:443/workflows/8917a73fd506444ea3af1aa10a300d17/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=9sSEESmcCFhhBgt3I-JXgpqEMEz0MyUxRJ3RCC-PSPA';

        const requestHeaders: Headers = new Headers();
        requestHeaders.append('Content-type', 'application/json');

        const httpClientOptions: any = {
            body: JSON.stringify({ UsersWithAccess: [dataItem.Requested_x0020_By, ...dataItem.Requires_x0020_Authorization_x0020_ByEmail.results] }),
            headers: requestHeaders
        };

        let response = await this.props.context.httpClient.post(WORKFLOW_API_URL, SPHttpClient.configurations.v1, httpClientOptions)

        if (response.ok === true && response.status === 200) {
            return await response.json();
        }
        else {
            // Something went wrong with the workflow. 
            throw 'Something went wrong, workflow failed!  Could not create an AR Invoice.';
        }
    }

    private handleSubmit = async dataItem => {
        this.setState({ saveRunning: true });
        try {
            let web = Web(this.props.context.pageContext.web.absoluteUrl);

            let arInvoiceProperties = {
                Title: `${new Date().getFullYear()}-AR-${BuildGUID()}`,
                Requested_x0020_ById: await (await GetUserByEmail(dataItem.Requested_x0020_By)).Id,
                ...this.parseCustomerData(dataItem)
            };

            delete arInvoiceProperties.GLAccounts;
            delete arInvoiceProperties.RelatedInvoiceAttachments;
            delete arInvoiceProperties.Requires_x0020_Authorization_x0020_ByEmail;
            delete arInvoiceProperties.Requested_x0020_By;

            // Send an HTTP request to a workflow to create the invoice.
            // Create the new AR Invoice and set departments permissions. 
            let arInvoiceId = await this.triggerARInvoiceWorkflow(dataItem);

            if (arInvoiceId !== null && Number.isInteger(arInvoiceId)) {
                // Since the workflow only creates the record and sets the permissions, this set the properties of the newly created AR Invoice for the first time.
                sp.web.lists.getByTitle(MyLists["AR Invoice Requests"]).items.getById(arInvoiceId).update(arInvoiceProperties);

                // Create the account records if any accounts are present. 

                // Create the related attachment records if any are present. 

                // Create an approval request for each approver. 

                // Show a message to the user letting them know that their invoice is ready. 
                alert('Done! It worked!');
                
                // Updating the formKey property will force the form to re-render.  This is what resets the form.
                this.setState({ formKey: this.state.formKey + 1 });
            }
            else {
                throw 'Could not update AR Invoice'
            }
        }
        catch (reason) {
            console.log(reason);
            this.setState({ errorMessage: 'Could not complete AR Request.' });
        }

        this.setState({ saveRunning: false });
    };
    //#endregion

    //#region Customer Field Methods
    /**
     * Render each customer item.
     * @param li List Item Element
     * @param itemProps List Item Props
     */
    private customerItemRender = (li, itemProps) => {
        return React.cloneElement(li, li.props, <span>{itemProps.dataItem.Customer_x0020_Name} | {itemProps.dataItem.WorkAddress}</span>);
    }

    private customerFilterChange = e => {
        setTimeout(() => {
            this.setState({
                customerList: this.filterData(e.filter)
            });
        }, 500);
    }

    private filterData(filter) {
        return filterBy(this.state.receivedCustomerList.slice(), filter);
    }
    //#endregion

    //#region Private Validation Methods
    /**
     * Checks to see if a customer has been selected, or if a misc customer has been entered. 
     * Customer cannot be undefined or null. 
     * Customer cannot have an ID property. 
     * 
     * When the customer object is set and it does not have an ID property that means we're entering something new. 
     * @param customer Customer from the input field
     */
    private _ShowCustomerDetails = (customer: any): boolean => {
        let b1 = customer !== undefined, b2 = customer !== null;
        let b3 = customer ? !customer.hasOwnProperty('ID') : false;
        return b1 && b2 && b3;
    }
    //#endregion

    public render() {
        return (
            <div key={this.state.formKey}>
                {
                    this.state.currentUser &&
                    <Form
                        initialValues={{
                            Date: new Date(),
                            Urgent: false,
                            Standard_x0020_Terms: 'NET 30, 1% INTEREST CHARGED',
                            GLAccounts: [],
                            Department: this.state.currentUser && this.state.currentUser.Props['SPS-Department'],
                            Requested_x0020_By: this.props.context.pageContext.user.email
                        }}
                        onSubmit={this.handleSubmit}
                        render={(formRenderProps) => (
                            <FormElement>
                                <legend className={'k-form-legend'}>ACCOUNTS RECEIVABLE - INVOICE REQUISITION </legend>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <FieldWrapper>
                                        <Field
                                            id="Requested_x0020_By"
                                            name="Requested_x0020_By"
                                            label="Requested By"
                                            wrapperStyle={{ width: '100%' }}
                                            context={this.props.context}
                                            userEmail={this.props.context.pageContext.user.email}
                                            component={MyFormComponents.FormPersonaDisplay}
                                        />
                                    </FieldWrapper>
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
                                        id="Department"
                                        name="Department"
                                        label="* Department"
                                        wrapperStyle={{ width: '45%' }}
                                        data={this.state.departments ? this.state.departments : []}
                                        validator={MyValidators.departmentValidator}
                                        component={MyFormComponents.FormDropDownList}
                                    />
                                    <Field
                                        id="Urgent"
                                        name="Urgent"
                                        label="Urgent"
                                        onLabel="Yes"
                                        offLabel="No"
                                        wrapperStyle={{ width: '50%' }}
                                        labelPlacement={'before'}
                                        component={MyFormComponents.FormCheckbox}
                                        hint={'Flag emails as high priority.'}
                                    />
                                </div>
                                <FieldWrapper>
                                    <Field
                                        id="Requires_x0020_Department_x0020_Id"
                                        name="Requires_x0020_Department_x0020_Id"
                                        label="* Requires Authorization By"
                                        wrapperStyle={{ width: '100%' }}
                                        dataItemKey="Email"
                                        textField="Title"
                                        hint={'Send an approval request to one or more users.'}
                                        validator={MyValidators.requireOneOrMorePeople}
                                        personSelectionLimit={10}
                                        context={this.props.context}
                                        selectedItems={e => {
                                            if (e && e.length > 0) {
                                                GetUsersByLoginName(e).then(res => {
                                                    /// Settings the user IDs here so that we can save them in the List item during the form submit event. 
                                                    formRenderProps.onChange('Requires_x0020_Department_x0020_Id', {
                                                        value: { 'results': res.map(user => { return user.Id; }) }
                                                    });

                                                    // Setting this email here so it can be passed to a workflow when the form is submitted.
                                                    // * By setting the users email here it saves us from querying this information during the forms submit event.  
                                                    formRenderProps.onChange('Requires_x0020_Authorization_x0020_ByEmail', {
                                                        value: { 'results': res.map(user => { return user.Email }) }
                                                    });
                                                });
                                            }
                                        }}
                                        component={MyFormComponents.FormPeoplePicker}
                                    />
                                </FieldWrapper>
                                <FieldWrapper>
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
                                    />
                                    {
                                        this._ShowCustomerDetails(formRenderProps.valueGetter('Customer')) &&
                                        <Field
                                            id={'MiscCustomerDetails'}
                                            name={'MiscCustomerDetails'}
                                            label={'Enter Additional Customer Details'}
                                            placeholder={'Address, Postal Code, Contact, etc....'}
                                            component={MyFormComponents.FormTextArea}
                                        />
                                    }
                                </FieldWrapper>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Field
                                        id="Customer_x0020_PO_x0020_Number"
                                        name="Customer_x0020_PO_x0020_Number"
                                        label="Customer PO Number"
                                        //validator={MyValidators.requiresCustomerPONUmber}
                                        component={MyFormComponents.FormInput}
                                    />

                                    <Field
                                        id="Standard_x0020_Terms"
                                        name="Standard_x0020_Terms"
                                        label="Standard Terms"
                                        wrapperStyle={{ width: '50%' }}
                                        defaultValue='NET 30, 1% INTEREST CHARGED'
                                        data={
                                            this.state.Standard_x0020_Terms
                                                ? this.state.Standard_x0020_Terms
                                                : []
                                        }
                                        component={MyFormComponents.FormDropDownList}
                                    />
                                </div>
                                <FieldWrapper>
                                    <Field
                                        id="Invoice_x0020_Details"
                                        name="Invoice_x0020_Details"
                                        label="Invoice Details"
                                        component={MyFormComponents.FormTextArea}
                                    />
                                </FieldWrapper>
                                <FieldWrapper>
                                    <p>Accounts go here...</p>
                                </FieldWrapper>
                                <FieldWrapper>
                                    <Field
                                        id="RelatedInvoiceAttachments"
                                        name="RelatedInvoiceAttachments"
                                        label="Upload Attachments"
                                        batch={false}
                                        multiple={true}
                                        component={MyFormComponents.FormUpload}
                                    />
                                </FieldWrapper>

                                {/* <FieldArray
                            name="users"
                            component={FormGrid}
                            validator={arrayLengthValidator}
                        /> */}
                                <div className="k-form-buttons">
                                    <Button
                                        primary={true}
                                        type={'submit'}
                                        disabled={this.state.saveRunning}
                                        icon="save"
                                    >Submit AR Invoice Request</Button>
                                    <Button onClick={formRenderProps.onFormReset} disabled={this.state.saveRunning}>Clear</Button>
                                </div>
                                {
                                    this.state.saveRunning &&
                                    <div style={{ marginTop: '5px' }}>
                                        <ProgressIndicator label="Saving your Invoice.  Please do not close the window until the invoice been processed." />
                                    </div>
                                }
                                {
                                    this.state.errorMessage && !this.state.saveRunning &&
                                    <Card type='error'>
                                        <CardBody>
                                            <CardTitle>Card Title</CardTitle>
                                            <p>{this.state.errorMessage}</p>
                                            <a href="mailto:helpdesk@clarington.net?subject = Cannot Submit AR Invoice">Please Contact helpdesk@clarington.net</a>
                                        </CardBody>
                                    </Card>
                                }
                            </ FormElement>
                        )}
                    />
                }
            </div>
        );
    }
}