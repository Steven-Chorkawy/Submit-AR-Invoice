import * as React from 'react';
import * as ReactDom from 'react-dom';

import { Stepper, Step, CardSubtitle } from '@progress/kendo-react-layout';
import { Card, CardTitle, CardBody, CardActions } from '@progress/kendo-react-layout';

import { IInvoiceAction } from './interface/InvoiceItem';
import { InvoiceActionResponseStatus } from './enums/MyEnums';
import { IInvoiceActionRequired, InvoiceActionRequiredRequestType } from './interface/IInvoiceActionRequired';


interface IActionStepsComponentProps {
    actions: Array<IInvoiceAction>;
}

interface IActionStepsComponentState {
    actions: any;
    stepperValue: number;
}

const CustomStep = (props) => {
    return (
        <Step {...props}>
            <span className="k-step-indicator">
                <span className={`k-step-indicator-icon k-icon ${props.icon}`}></span>
            </span>
            <Card
                // style={{ width: '500px' }}
                type={
                    props.Response_x0020_Status === InvoiceActionResponseStatus.Waiting ? 'info' :
                        props.Response_x0020_Status === InvoiceActionResponseStatus.Approved ? 'success' :
                            props.Response_x0020_Status === InvoiceActionResponseStatus.Denied || props.Response_x0020_Status === InvoiceActionResponseStatus.Rejected ? 'error' :
                                ''
                }>
                <CardBody>
                    <CardTitle>{props.label}</CardTitle>
                    <CardSubtitle>
                        {
                            props.Response_x0020_Status === InvoiceActionResponseStatus.Waiting ?
                                `Waiting for ${props.AssignedTo.Title}` :
                                `${props.Response_x0020_Status} by ${props.AssignedTo.Title}`
                        }
                    </CardSubtitle>
                    {props.Response_x0020_Message && <p>"{props.Response_x0020_Message}"</p>}
                </CardBody>
            </Card>
        </Step>
    );
};

export class ActionStepsComponent extends React.Component<IActionStepsComponentProps, IActionStepsComponentState> {

    constructor(props) {
        super(props);
        this.state = {
            actions: this.props.actions.map(action => {
                return ({
                    icon: this._parseActionType(action),
                    label: action.Request_x0020_Type,
                    isValid: action.Response_x0020_Status === InvoiceActionResponseStatus.Denied ? false : true,
                    AssignedTo: action.AssignedTo,
                    Response_x0020_Status: action.Response_x0020_Status,
                    Response_x0020_Message: action.Response_x0020_Message
                });
            }),
            stepperValue: this.props.actions.map(el => el.Response_x0020_Status).lastIndexOf(InvoiceActionResponseStatus.Approved)
        };
    }

    private _parseActionType = (action) => {
        let output = 'k-i-info';
        switch (action.Request_x0020_Type) {
            case InvoiceActionRequiredRequestType.DepartmentApprovalRequired:
            case InvoiceActionRequiredRequestType.AccountantApprovalRequired:
            case InvoiceActionRequiredRequestType.AccountingClerk2ApprovalRequired:
                output = 'k-i-check';
                break;
            case InvoiceActionRequiredRequestType.EditRequired:
                output = 'k-i-edit';
                break;
            default:
                break;
        }

        if (action.Response_x0020_Status === InvoiceActionResponseStatus.Rejected || action.Response_x0020_Status === InvoiceActionResponseStatus.Denied) {
            output = 'k-i-close';
        }

        return output;
    }

    public render() {
        return (
            <Stepper
                items={this.state.actions}
                item={CustomStep}
                value={this.state.stepperValue}
                orientation={'vertical'}
            />
        );
    }
}
