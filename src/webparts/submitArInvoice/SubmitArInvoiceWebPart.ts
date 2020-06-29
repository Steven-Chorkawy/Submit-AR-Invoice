import * as React from 'react';
import * as ReactDom from 'react-dom';

import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { escape } from '@microsoft/sp-lodash-subset';

import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/fields";
import "@pnp/sp/site-users/web";

import './MyO365.scss';
import * as strings from 'SubmitArInvoiceWebPartStrings';

import { MyForm } from './components/MyKendoForm';
import { IMyFormProps } from './components/IMyFormProps';

export interface ISubmitArInvoiceWebPartProps {
  description: string;
}

export default class SubmitArInvoiceWebPart extends BaseClientSideWebPart<ISubmitArInvoiceWebPartProps> {
  myFormProps = {} as IMyFormProps;

  /**
   * Get Users who have access to this site.  These users will be used to populate dropdown lists.
   *
   * TODO: Get users who are in the groups and return a list of ALL users who have access to this site.
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



  public render(): void {

    Promise.all([this.getSiteUsers(), this.getCustomers(), sp.web.lists.getByTitle('AR Invoices').fields.filter(`Hidden eq false`).get()])
      .then((values) => {
        console.log("Fields for lib");
        console.log(values[2]);

        this.myFormProps.siteUsers = values[0];
        this.myFormProps.customerList = values[1];
      })
      .then(_ => {
        const element: React.ReactElement<IMyFormProps> = React.createElement(
          MyForm,
          { ctx:this.context, ...this.myFormProps }
        );

        ReactDom.render(element, this.domElement);
      });
  }


  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
