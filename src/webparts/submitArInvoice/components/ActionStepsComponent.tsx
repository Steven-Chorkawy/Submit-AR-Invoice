import * as React from 'react';
import * as ReactDom from 'react-dom';

import { Stepper, Step, CardSubtitle } from '@progress/kendo-react-layout';
import { Card, CardTitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';

import { ActivityItem, IActivityItemProps, Link, mergeStyleSets } from 'office-ui-fabric-react';
import Moment from 'react-moment';

import { IInvoiceAction } from './interface/InvoiceItem';
import { InvoiceActionResponseStatus, InvoiceActionRequestTypes } from './enums/MyEnums';

import { PersonaComponent } from './PersonaComponent';
import { PersonaSize } from '@fluentui/react';

interface IActionStepsComponentProps {
    actions: Array<IInvoiceAction>;
    onAddNewApproval?: any;
}

const classNames = mergeStyleSets({
    exampleRoot: {
        marginTop: '20px',
    },
    nameText: {
        fontWeight: 'bold',
    },
});

const parseActionType = (action) => {
    let output = 'k-i-info';
    switch (action.Request_x0020_Type) {
        case InvoiceActionRequestTypes.DepartmentApprovalRequired:
        case InvoiceActionRequestTypes.AccountantApprovalRequired:
        case InvoiceActionRequestTypes.AccountingClerkApprovalRequired:
            output = 'k-i-check';
            break;
        case InvoiceActionRequestTypes.EditRequired:
            output = 'k-i-edit';
            break;
        default:
            break;
    }

    if (action.Response_x0020_Status === InvoiceActionResponseStatus.Rejected || action.Response_x0020_Status === InvoiceActionResponseStatus.Denied) {
        output = 'k-i-close';
    }

    return output;
};

const CustomStep = (props) => {
    return (
        <Step {...props}>
            <span className="k-step-indicator" title={props.Request_x0020_Type}>
                <span className={`k-step-indicator-icon k-icon ${parseActionType(props)}`}></span>
            </span>
            <Card
                style={{ marginBottom: '5px' }}
                type={
                    props.Response_x0020_Status === InvoiceActionResponseStatus.Waiting ? 'info' :
                        props.Response_x0020_Status === InvoiceActionResponseStatus.Approved ? 'success' :
                            props.Response_x0020_Status === InvoiceActionResponseStatus.Denied || props.Response_x0020_Status === InvoiceActionResponseStatus.Rejected ? 'error' :
                                ''
                }>
                <ActivityItem
                    {
                    ...{
                        label: props.Request_x0020_Type,
                        isValid: props.Response_x0020_Status === InvoiceActionResponseStatus.Denied ? false : true,
                        activityDescription: [
                            <span>{props.Response_x0020_Status === InvoiceActionResponseStatus.Waiting ? `Waiting for ` : `${props.Response_x0020_Status} by `}</span>,
                            <PersonaComponent userEmail={props.AssignedTo.EMail} personaSize={PersonaSize.size24} />
                        ],
                        comments: props.Response_x0020_Message ? props.Response_x0020_Message : '',
                        timeStamp: <div style={{ paddingTop: '5px' }}><span title='Created'><Moment format="MM/DD/YYYY">{props.Created}</Moment></span> | <span title='Modified'><Moment format="MM/DD/YYYY">{props.Modified}</Moment></span></div>
                    }
                    }
                    key={props.ID}
                />
            </Card>
        </Step>
    );
};

export class ActionStepsComponent extends React.Component<IActionStepsComponentProps, any> {

    constructor(props) {
        super(props);
    }

    public render() {
        return (
            <div>
                <Stepper
                    items={this.props.actions}
                    item={CustomStep}
                    value={
                        this.props.actions.map(el => el.Response_x0020_Status).lastIndexOf(InvoiceActionResponseStatus.Approved)
                    }
                    orientation={'vertical'}
                />
                {
                    this.props.onAddNewApproval &&
                    <Button onClick={this.props.onAddNewApproval} icon={'check'}>Request Approval</Button>
                }
            </div>
        );
    }
}
