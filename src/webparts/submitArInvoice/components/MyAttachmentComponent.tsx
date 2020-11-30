import * as React from 'react';
import { sp } from '@pnp/sp';

import { Card, CardTitle, CardSubtitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { Field } from '@progress/kendo-react-form';
import { Button } from '@progress/kendo-react-buttons';
import { UploadFileStatus } from '@progress/kendo-react-upload';

import * as MyFormComponents from './MyFormComponents';
import { MyLists } from './enums/MyLists.js';
import { BooleanFilter } from '@progress/kendo-react-data-tools';


interface IMyAttachmentComponentProps {
    cardTitle: string;
    boldCardTitle?: boolean;
    productInEdit: any;
    context: any;
    id: string;
    name?: string;
    documentLibrary: string;
    onAdd: Function;
    onRemove: Function;
}

interface IUploadFileInfo {
    name: string;
    progress: number;
    status: UploadFileStatus;
    uid: string;
    id?: number;
    ServerRedirectedEmbedUrl?: string;
}

interface IMyAttachmentComponentState {
    defaultFiles: Array<IUploadFileInfo>;
}


/**
 * Render each individual file. 
 */
class CustomListItemUI extends React.Component<any> {
    constructor(props) {
        super(props);
    }

    public render() {
        const { files } = this.props;
        return (
            files.map(file =>
                // This element is a copy of Kendo's default element.  
                <div key={file.name} className='k-file-single'>
                    <span className='k-progress' style={{ width: `${file.progress ? file.progress : 0}%`, transition: 'opacity 0.5s ease-in-out 0s;' }}></span>
                    <span className='k-file-extension-wrapper'>
                        <span className='k-file-extension'></span>
                        <span className='k-file-state'></span>
                    </span>
                    <span className='k-file-name-size-wrapper'>
                        {
                            file.ServerRedirectedEmbedUrl ?
                                <a href={file.ServerRedirectedEmbedUrl} target='_blank' data-interception='off'>
                                    <span className='k-file-name' title={file.name}>{file.name}</span>
                                </a> :
                                <span className='k-file-name' title={file.name}>{file.name}</span>
                        }
                        <span className='k-file-size'></span>
                    </span>
                    <strong className='k-upload-status'>
                        {
                            file.id &&
                            <Button
                                icon={'close'}
                                type={'button'}
                                look={'flat'}
                                title={'Delete File'}
                                onClick={
                                    (e) => this.props.onRemove(file.uid)
                                }
                            />
                        }
                    </strong>
                </div>
            )
        );
    }
}


export class MyAttachmentComponent extends React.Component<IMyAttachmentComponentProps, IMyAttachmentComponentState> {

    constructor(props) {
        super(props);

        this.state = {
            defaultFiles: this.props.productInEdit[this.props.id]
                .map(attachment => ({
                    name: attachment.Title,
                    progress: 100,
                    status: UploadFileStatus.Uploaded,
                    uid: attachment.GUID,
                    id: attachment.ID,
                    ServerRedirectedEmbedUrl: attachment.ServerRedirectedEmbedUrl
                }))
        };
    }

    private _updateFileProgress = (uid, progress) => {
        let oldDefaultFilesState = this.state.defaultFiles;
        oldDefaultFilesState[oldDefaultFilesState.findIndex(f => f.uid === uid)].progress = progress;
        this.setState({
            defaultFiles: [...oldDefaultFilesState]
        });
    }

    /**
     * Upload a document as soon as it has been added to the upload widget.
     * @param e Upload widgets event object.
     */
    private _onAdd = e => {
        let newFiles = e.affectedFiles.map(file => (
            { status: UploadFileStatus.Uploading, name: file.name, progress: 0, uid: file.uid }
        ));
        this.setState({
            defaultFiles: [
                ...this.state.defaultFiles,
                ...newFiles
            ]
        });
        // affectedFiles are the files that have just been added. 
        // Loop through these to upload each one to SharePoint.
        for (let index = 0; index < e.affectedFiles.length; index++) {
            const element = e.affectedFiles[index];
            // Upload the document to the Related Invoice Attachments Document Library. 
            sp.web.getFolderByServerRelativeUrl(`${this.props.context.pageContext.web.serverRelativeUrl}/${MyLists['Related Invoice Attachments']}`)
                .files
                .add(element.name, element.getRawFile(), true)
                .then(fileRes => {
                    this._updateFileProgress(element.uid, 25);
                    // After the document has been uploaded, we can get it's metadata like so...
                    fileRes.file.getItem().then(item => {
                        this._updateFileProgress(element.uid, 50);
                        const itemProxy: any = Object.assign({}, item);
                        // Update the metadata of the document that has just been uploaded to record which invoice request it belongs to & give it a title that can be used later. 
                        sp.web.lists.getByTitle(MyLists['Related Invoice Attachments'])
                            .items.getById(itemProxy.ID)
                            .update({ AR_x0020_Invoice_x0020_RequestId: this.props.productInEdit.Id, Title: element.name })
                            .then(rAttachmentRes => {
                                this._updateFileProgress(element.uid, 75);
                                // This gets the requests existing related attachments.
                                // This needs to be done so we can see a list of all the related attachments as a column. 
                                let currentRAttachmentIds = this.props.productInEdit.RelatedAttachments
                                    .filter(fromRelatedAttachments => fromRelatedAttachments.hasOwnProperty('Id'))
                                    .map(fromRelatedAttachmentsMap => fromRelatedAttachmentsMap.Id);
                                // After we've added all the existing documents we can append this newest document.
                                currentRAttachmentIds.push(itemProxy.ID);
                                // Update the invoice request with a list of all it's related documents. 
                                sp.web.lists.getByTitle(MyLists['AR Invoice Requests'])
                                    .items.getById(this.props.productInEdit.Id)
                                    .update({
                                        RelatedAttachmentsId: {
                                            results: currentRAttachmentIds
                                        }
                                    })
                                    .then(done => {
                                        this._updateFileProgress(element.uid, 85);
                                        // After everything is done, query the file from SharePoint to get it's ServerRedirectedEmbedUrl
                                        sp.web.lists.getByTitle('RelatedInvoiceAttachments')
                                            .items
                                            .filter(`AR_x0020_Invoice_x0020_Request/ID eq ${this.props.productInEdit.Id}`)
                                            .getAll()
                                            .then(newestMetadata => {
                                                sp.web.getFolderByServerRelativePath(MyLists["Related Invoice Attachments"])
                                                    .files().then(docFromSP => {
                                                        let thisNewFile = docFromSP.find(f => f.Title === element.name);
                                                        let thisNewFileMetadata = newestMetadata.find(f => f.Title === element.name);

                                                        let oldFileState = this.state.defaultFiles;
                                                        let oldFileStateIndex = oldFileState.findIndex(f => f.name === element.name);
                                                        let oldFileStateMetadata = oldFileState[oldFileStateIndex];
                                                        oldFileStateMetadata = {
                                                            ...oldFileState[oldFileState.findIndex(f => f.name === element.name)],
                                                            ServerRedirectedEmbedUrl: thisNewFile.ServerRelativeUrl,
                                                            id: thisNewFileMetadata.ID,
                                                            status: UploadFileStatus.Uploaded,
                                                            progress: 100
                                                        };
                                                        oldFileState[oldFileStateIndex] = oldFileStateMetadata;

                                                        this.props.onAdd(oldFileStateMetadata, this.props.productInEdit.Id);

                                                        this.setState({
                                                            defaultFiles: [...oldFileState]
                                                        });
                                                    });
                                            });
                                    });
                            });
                    });
                });
        }
    }

    private _onRemove = e => {
        for (let index = 0; index < e.affectedFiles.length; index++) {
            const file = e.affectedFiles[index];

            let oldFileState = this.state.defaultFiles;
            let oldFileStateIndex = oldFileState.findIndex(f => f.name === file.name);

            oldFileState[oldFileStateIndex] = {
                ...oldFileState[oldFileStateIndex],
                status: UploadFileStatus.Removing
            };

            this.setState({
                defaultFiles: [...oldFileState]
            });

            sp.web.getFolderByServerRelativePath(MyLists["Related Invoice Attachments"])
                .files
                .getByName(file.name)
                .delete()
                .then(f => {
                    this.setState({
                        defaultFiles: e.newState
                    });
                    this.props.onRemove(oldFileState[oldFileStateIndex], this.props.productInEdit.Id);
                })
                .catch(f => {
                    oldFileState[oldFileStateIndex] = {
                        ...oldFileState[oldFileStateIndex],
                        status: UploadFileStatus.RemoveFailed
                    };

                    this.setState({
                        defaultFiles: oldFileState
                    });
                });
        }
    }

    private MyItemRender = (props) => <CustomListItemUI {...props} />;

    public render() {
        return (
            <Card style={{ width: 400 }}>
                <CardBody>
                    <CardTitle>
                        {
                            this.props.boldCardTitle ? <b>{this.props.cardTitle}</b> : this.props.cardTitle
                        }
                    </CardTitle>
                    <Field
                        id={this.props.id}
                        name={this.props.name ? this.props.name : this.props.id}
                        batch={false}
                        multiple={true}
                        context={this.props.context}
                        documentLibrary={this.props.documentLibrary}
                        component={MyFormComponents.FormAutoUpload}
                        files={this.state.defaultFiles}
                        listItemUI={this.MyItemRender}
                        myOnAdd={this._onAdd}
                        myOnRemove={this._onRemove}
                    />
                </CardBody>
            </Card>
        );
    }
}