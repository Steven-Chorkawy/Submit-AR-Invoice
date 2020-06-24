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


  private getSiteUsers = async () => {
    const siteUsers = await sp.web.siteUsers();
    return siteUsers.filter(user => user.Email != "");
  }

  private getCustomers = async () => {
    let customers = await sp.web.lists.getByTitle('Customers').items.get();
    console.log("Customer Data");
    console.log(customers);
    return customers;
  }



  public render(): void {
    Promise.all([this.getSiteUsers(), this.getCustomers()])
      .then((values) => {
        console.log("getFormProps done!");
        console.log(values);

        this.myFormProps.siteUsers = values[0];
        this.myFormProps.customerList = values[1];
      })
      .then(_ => {
        console.log("Loading Form");
        const element: React.ReactElement<IMyFormProps> = React.createElement(
          MyForm,
          { ...this.myFormProps }
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
