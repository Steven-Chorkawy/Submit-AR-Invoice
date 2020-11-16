import * as React from 'react';
import * as ReactDom from 'react-dom';

import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneDropdown
} from '@microsoft/sp-property-pane';

import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';


import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/fields";
import "@pnp/sp/site-users/web";

import './bootstrap.min.css';
import './MyO365.scss';
import './custom.css';


// ? What is this for ?
import * as strings from 'SubmitArInvoiceWebPartStrings';

import { MyForm } from './components/MyKendoForm';
import { MyFinanceForm } from './components/FinanceForms/MyFinanceForm';
import { MyKendoGrid } from './components/DepartmentForm/MyKendoGrid';
import { OrdersListView } from './components/OrderListView/OrdersListView';
import { DepartmentListView } from './components/DepartmentForm/DepartmentListView';
import { IMyFormProps } from './components/IMyFormProps';

export interface ISubmitArInvoiceWebPartProps {
  description: string;
  ActiveDisplay: ActiveDisplay;
}


export enum ActiveDisplay {
  CreateARForm = 1,
  DepartmentForm = 2,
  FinanceForm = 3,
  DepartmentListView = 4,
  OrdersListView = 5
}


export default class SubmitArInvoiceWebPart extends BaseClientSideWebPart<ISubmitArInvoiceWebPartProps> {
  public myFormProps = {} as IMyFormProps;

  protected async onInit(): Promise<void> {
    await super.onInit()
      .then(_ => {
        sp.setup({
          spfxContext: this.context,
          sp: {
            headers: {
              "Accept": "application/json; odata=nometadata"
            },
            baseUrl: this.context.pageContext.web.absoluteUrl
          }
        });
      });
  }

  /**
   * Get Users who have access to this site.  These users will be used to populate dropdown lists.
   *
   * TODO: Get users who are in the groups and return a list of ALL users who have access to this site.
   * * As seen here https://github.com/pnp/pnpjs/issues/1024 this is a feature that can be achieved through PnPjs Graph.
   */
  private getSiteUsers = async () => {
    const siteUsers = await sp.web.siteUsers();

    // siteUsers() returns a list of users and groups.
    // by filtering out "users" who do not have a UserPrincipalName I can return a list of only users and no groups.
    return siteUsers.filter(user => user.UserPrincipalName != null);
  }

  private getCustomers = async () => {
    let customers = await sp.web.lists.getByTitle('Customers').items.get();
    return customers;
  }



  private getARInvoices = async () => {

    let arInvoices = await sp.web.lists.getByTitle('Ar Invoices')
      .items
      .select(`*, FileRef,
    Customer/Title,
    AccountDetails/Account_x0020_Code,
    AccountDetails/Amount,
    AccountDetails/ID`)
      .expand('Customer, AccountDetails')
      .get();


    let accounts = await sp.web.lists.getByTitle("AR Invoice Accounts")
      .items
      .get();

    // This is how we can get additional data since the .select() method only include Dependent Lookups
    // https://github.com/pnp/pnpjs/issues/1258 <--- see my open ticket here.
    arInvoices.map(invoice => {
      for (let index = 0; index < invoice.AccountDetails.length; index++) {
        let element = invoice.AccountDetails[index];
        var newAccount = accounts.find(a => a.ID == element.ID);
        invoice.AccountDetails[index] = newAccount;
      }
    });

    return arInvoices;
  }


  public render(): void {

    switch (this.properties.ActiveDisplay) {
      case ActiveDisplay.CreateARForm:
        Promise.all([this.getSiteUsers(), this.getCustomers()])
          .then((values) => {
            this.myFormProps.siteUsers = values[0];
            this.myFormProps.customerList = values[1];
          })
          .then(_ => {
            let departmentElement: React.ReactElement<IMyFormProps> = React.createElement(
              MyForm,
              { context: this.context, properties: this.properties, ...this.myFormProps }
            );
            ReactDom.render(departmentElement, this.domElement);
          });
        break;

      case ActiveDisplay.DepartmentForm:
        Promise.all([this.getARInvoices(), this.getSiteUsers(), this.getCustomers()])
          .then((values) => {
            let depSearchElement: React.ReactElement = React.createElement(
              MyKendoGrid,
              { context: this.context, properties: this.properties, data: values[0], siteUsers: values[1], customers: values[2] }
            );

            ReactDom.render(depSearchElement, this.domElement);
          });
        break;

      case ActiveDisplay.DepartmentListView:
        Promise.all([this.getARInvoices(), this.getSiteUsers(), this.getCustomers()])
          .then((values) => {
            let depSearchElement: React.ReactElement = React.createElement(
              DepartmentListView,
              { context: this.context, sproperties: this.properties, data: values[0], siteUsers: values[1], customers: values[2] }
            );

            ReactDom.render(depSearchElement, this.domElement);
          });
        break;

      case ActiveDisplay.FinanceForm:
        let financeForm: React.ReactElement = React.createElement(
          MyFinanceForm,
          { context: this.context }
        );

        ReactDom.render(financeForm, this.domElement);
        break;

      case ActiveDisplay.OrdersListView:
        let ordersListView: React.ReactElement = React.createElement(
          OrdersListView,
          { context: this.context }
        );
        break;

      default:
        break;
    }
  }


  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: "Configure Properties"
          },
          groups: [
            {
              groupName: "Web Part Display",
              groupFields: [
                PropertyPaneDropdown('ActiveDisplay', {
                  label: 'Select Active Component',
                  options: [
                    { key: ActiveDisplay.CreateARForm, text: 'Create AR Form' },
                    { key: ActiveDisplay.DepartmentForm, text: 'Departments Form' },
                    { key: ActiveDisplay.FinanceForm, text: 'Finance Form' },
                    { key: ActiveDisplay.OrdersListView, text: 'Orders List View' },
                  ]
                }),
              ]
            },
            {
              groupName: "Create AR Form",
              groupFields: [
                PropertyPaneTextField('description2', {
                  label: 'Description 2'
                }),
              ]
            }
          ]
        }
      ]
    };
  }
}
