import * as React from 'react';
import * as ReactDom from 'react-dom';

// Import PnP stuff.
import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";

// Import Kendo Components
import { Button, ButtonGroup } from '@progress/kendo-react-buttons';

// Import my stuff
import { IInvoiceItem } from './interface/MyInterfaces';
import { InvoiceStatus, InvoiceActionResponseStatus } from './enums/MyEnums';
import { ISiteUserInfo } from '@pnp/sp/site-users/types';

interface IQuickFilterButtonGroupProps {
  invoices: Array<IInvoiceItem>;
  onButtonClick: any;
}

interface IQuickFilterButtonGroupState {
  currentUser: ISiteUserInfo;
  filterButtons: Array<IQuickFilterButton>;
  selected: number;
}

/**
 * Properties that we will use to render quick filter buttons.
 */
interface IQuickFilterButton {
  text: string;
  getData: Function;
}

class QuickFilterButtonGroup extends React.Component<IQuickFilterButtonGroupProps, IQuickFilterButtonGroupState> {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: null,
      selected: 0,  // Select the first button by default.
      filterButtons: [
        { text: "Show Active", getData: this._allInvoices },
        { text: "For You", getData: this._invoicesForCurrentUser },
        { text: "Urgent", getData: this._urgentInvoices },
        { text: "Approved", getData: this._approvedInvoices },
        { text: 'Completed', getData: () => alert('clicked!') },
        { text: "Waiting Approval", getData: this._waitingApproval },
      ]
    };

    sp.web.currentUser.get()
      .then(user => {
        this.setState({
          currentUser: user
        });
      });
  }

  //#region Filter Invoice Methods
  private _allInvoices = () => {
    return this.props.invoices ? this.props.invoices : null;
  }

  private _urgentInvoices = () => {
    return this.props.invoices ? this.props.invoices.filter(f => f.Urgent === true) : null;
  }

  // Get invoices that have actions assigned to this user with a status of Waiting.
  private _invoicesForCurrentUser = () => {
    return this.props.invoices ? this.props.invoices.filter(x =>
      x.Actions.some(y =>
        y.Response_x0020_Status === InvoiceActionResponseStatus.Waiting
        && y.AssignedToId === this.state.currentUser.Id
      )
    ) : null;
  }

  // return invoices that have all actions with a status of approved.
  private _approvedInvoices = () => {
    return this.props.invoices ? this.props.invoices
      .filter(
        f => f.Actions.filter(ff => ff.Response_x0020_Status === InvoiceActionResponseStatus.Approved)
          .length === f.Actions.length && f.Actions.length > 0
      ) : null;
  }

  private _waitingApproval = () => {
    return this.props.invoices ? this.props.invoices.filter(x =>
      x.Actions.some(y =>
        y.Response_x0020_Status === InvoiceActionResponseStatus.Waiting
      )
    ) : null;
  }
  //#endregion Filter Invoice Methods

  //#region Helper Methods
  private _filterButtonClickEvent = e => {
    this.setState({
      selected: parseInt(e.target.id)
    });
    this.props.onButtonClick(e, this.state.filterButtons[parseInt(e.target.id)].getData());
  }

  /**
   * This tells us which button is currently selected.
   * Per Kendo Support: https://www.telerik.com/account/support-tickets/view-ticket/1482557
   * @param index Index of Selected Button
   */
  private _isSelected = (index: number) => {
    return index === this.state.selected ? true : false;
  }
  //#endregion Helper Methods

  public render() {
    return (
      this.state.currentUser && <div>
        <ButtonGroup>
          {this.state.filterButtons.map((button, index) => {
            let buttonDataLength = 0;

            if (button.getData()) {
              buttonDataLength = button.getData().length;
            }

            return (
              <Button
                id={index.toString()}
                disabled={buttonDataLength > 0 ? false : true}
                togglable={true}
                selected={this._isSelected(index)}
                onClick={this._filterButtonClickEvent}
              >
                {button.text} {buttonDataLength > 0 && `(${button.getData().length})`}
              </Button>
            );
          })}
        </ButtonGroup>
      </div>
    );
  }
}

export { QuickFilterButtonGroup };
