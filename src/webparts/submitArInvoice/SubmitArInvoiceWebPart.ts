import * as React from 'react';
import * as ReactDom from 'react-dom';

import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { escape } from '@microsoft/sp-lodash-subset';

import './MyO365.scss';
import * as strings from 'SubmitArInvoiceWebPartStrings';

import { MyForm } from './components/MyKendoForm'

export interface ISubmitArInvoiceWebPartProps {
  description: string;
}

export default class SubmitArInvoiceWebPart extends BaseClientSideWebPart<ISubmitArInvoiceWebPartProps> {

  public render(): void {
    const element: React.ReactElement = React.createElement(
      MyForm
    );

    ReactDom.render(element, this.domElement);
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
