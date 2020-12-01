import * as React from 'react';
import * as ReactDom from 'react-dom';

// Kendo Imports
import { GridDetailRow } from '@progress/kendo-react-grid';

import { Card, CardTitle, CardSubtitle, CardBody, CardActions } from '@progress/kendo-react-layout';

// Custom Imports
import { ActionStepsComponent } from './ActionStepsComponent';
import { IInvoiceItem } from './interface/MyInterfaces';
import { GLAccountsListView, GLAccountsListViewDisplayMode } from './MyFinanceGLAccounts';
import { CustomAttachmentItemUI, MyAttachmentComponent } from './MyAttachmentComponent';


export class InvoiceGridDetailComponent extends GridDetailRow {

  constructor(props) {
    super(props);
    this.detailItem = this.props.dataItem;
  }

  private detailItem: IInvoiceItem;

  private _bsColClassNames = 'col-lg-4 col-sm-12';
  private _maxWidth = '1000px';

  public render() {
    return (
      <div style={{ maxWidth: this._maxWidth }}>
        <div className={'row'}>
          {
            this.props.dataItem.Actions && this.props.dataItem.Actions.length > 0 &&
            <div className={this._bsColClassNames}>
              <Card>
                <CardBody>
                  <CardTitle>Approval Requests</CardTitle>
                  <ActionStepsComponent actions={this.props.dataItem.Actions} />
                </CardBody>
              </Card>
            </div>
          }
          {
            this.props.dataItem.AccountDetails &&
            <div className={this._bsColClassNames}>
              <Card>
                <CardBody>
                  <CardTitle>GL Account Codes</CardTitle>
                  <GLAccountsListView editable={false} displayMode={GLAccountsListViewDisplayMode.vertical} value={this.props.dataItem.AccountDetails} />
                </CardBody>
              </Card>
            </div>
          }
          {
            this.props.dataItem.RelatedAttachments &&
            <div className={this._bsColClassNames}>
              <Card>
                <CardBody>
                  <CardTitle>Related Attachments</CardTitle>
                  <div className='k-card-list'>
                    {
                      this.props.dataItem.RelatedAttachments.map(file => {
                        return (
                          <a dir='ltr' className='k-card k-card-vertical' href={file.ServerRedirectedEmbedUrl} target='_blank' data-interception='off' >
                            <span className="k-file-name k-card-body" title={file.Title}>{file.Title}</span>
                          </a>
                        );
                      })
                    }
                  </div>
                </CardBody>
              </Card>
            </div>
          }
        </div>
      </div>
    );
  }
}
