import { IInputs, IOutputs } from "./generated/ManifestTypes"
import * as React from 'react'
import * as ReactDom from 'react-dom'
import { DropdownMenuItemType, IDropdownOption } from '@fluentui/react/lib/Dropdown'
import { SearchableDropdown } from './SearchableDropdown'

export class LookupAsOptionSet implements ComponentFramework.StandardControl<IInputs, IOutputs> {

    private _context: ComponentFramework.Context<IInputs>;
    private container: HTMLDivElement;
    private notifyOutputChanged: () => void;
    private entityName: string;
    private entityIdFieldName: string;
    private entityNameFieldName: string;
    private entityDisplayName: string;
    private viewId: string;
    private availableOptions: IDropdownOption[];
    private currentValue?: ComponentFramework.LookupValue[];
    private newlyCreatedId: string | null;
    private parentId: string | null;
    private selectedValue?: ComponentFramework.LookupValue[];

    constructor() {
        // Empty constructor 
    }

    /**
     * Renders a fallback UI when the lookup entity name is missing.
     */
    private renderFallback(): void {
        console.warn("Rendering fallback UI due to missing entity name.");
        const fallbackElement = React.createElement(
            "div",
            {
                className: "custom-fallback",
            },
            "---"
        );
        ReactDom.render(fallbackElement, this.container);
    }

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        try {
            this._context = context;
            this.container = container
            this.notifyOutputChanged = notifyOutputChanged

            this.entityName = this._context.parameters.lookup.getTargetEntityType()
            this.viewId = this._context.parameters.lookup.getViewId();

            this.currentValue = this._context.parameters.lookup.raw;
            this.selectedValue = this._context.parameters.lookup.raw;

            if (!this.entityName) {
                console.warn("Lookup entity name is missing, displaying fallback UI.")
                this.renderFallback();
                return;
            }

            this._context.utils.getEntityMetadata(this.entityName).then(metadata => {
                this.entityIdFieldName = metadata.PrimaryIdAttribute
                this.entityNameFieldName = metadata.PrimaryNameAttribute
                this.entityDisplayName = metadata.DisplayName;

                this.retrieveRecords(); // Calling retrieveRecords without async
                return true;
            }).catch(error => {
                console.error("Metadata fetch error:", error);
                this.renderFallback();
                throw error;
            });

        } catch (error) {
            console.error("Init error:", error);
            this.renderFallback();
        }
    }

    /**
     * Retrieve records based on the FetchXML query.
     */
    private retrieveRecords(): void {

        let filter = "";
        if (this.viewId) {
            filter = "?$top=1&$select=fetchxml,returnedtypecode&$filter=savedqueryid eq " + this.viewId;
        } else {
            filter = "?$top=1&$select=fetchxml,returnedtypecode&$filter=returnedtypecode eq '" + this.entityName + "' and querytype eq 64";
        }

        // Retrieve FetchXML query
        this._context.webAPI.retrieveMultipleRecords('savedquery', filter).then(result => {
            const view = result.entities[0];
            let xml = view.fetchxml;

            if (
                this._context.parameters.dependantLookup &&
                this._context.parameters.dependantLookup.raw &&
                this._context.parameters.dependantLookup.raw.length > 0
            ) {
                const dependentId = this._context.parameters.dependantLookup.raw[0].id;
                const attributeName = this._context.parameters.dependantLookup.attributes?.LogicalName ?? "";

                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xml, "text/xml");
                const entityNode = xmlDoc.getElementsByTagName("entity")[0];

                if (this._context.parameters.intersectEntityName.raw && this._context.parameters.intersectToAttribute.raw) {
                    const intersectEntityName = this._context.parameters.intersectEntityName.raw ?? "";
                    const toAttr = this._context.parameters.intersectToAttribute.raw ?? "";

                    console.debug("Using N:N filtering");
                    console.debug("Intersect Entity:", intersectEntityName);
                    console.log("From:", this.entityIdFieldName, "| To:", toAttr);

                    const linkEntity = xmlDoc.createElement("link-entity");
                    linkEntity.setAttribute("name", intersectEntityName);
                    linkEntity.setAttribute("from", this.entityIdFieldName);
                    linkEntity.setAttribute("to", this.entityIdFieldName);
                    linkEntity.setAttribute("link-type", "inner");
                    linkEntity.setAttribute("alias", "link1");

                    const condition = xmlDoc.createElement("condition");
                    condition.setAttribute("attribute", toAttr);
                    condition.setAttribute("operator", "eq");
                    condition.setAttribute("value", dependentId);

                    const linkFilter = xmlDoc.createElement("filter");
                    linkFilter.setAttribute("type", "and");
                    linkFilter.appendChild(condition);
                    linkEntity.appendChild(linkFilter);
                    entityNode.appendChild(linkEntity);

                    console.debug("Added N:N <link-entity>: ", linkEntity.outerHTML);
                } else {
                    console.debug("Using 1:N filtering");

                    const filterNodes = entityNode.getElementsByTagName("filter");
                    const filterNode = filterNodes.length === 0 ? xmlDoc.createElement("filter") : filterNodes[0];
                    if (filterNodes.length === 0) {
                        entityNode.appendChild(filterNode);
                    }

                    const conditionNode = xmlDoc.createElement("condition");
                    conditionNode.setAttribute("attribute", attributeName);
                    conditionNode.setAttribute("operator", "eq");
                    conditionNode.setAttribute("value", dependentId);
                    filterNode.appendChild(conditionNode);

                    console.debug("Added 1:N <condition>: ", conditionNode.outerHTML);
                }

                xml = xmlDoc.documentElement.outerHTML;
                console.debug("Final FetchXML after filtering:", xml);
            }

            const mask = this._context.parameters.attributemask.raw;
            const localizedEntityFieldName = mask ? mask.replace('{lcid}', this._context.userSettings.languageId.toString()) : "";

            if (localizedEntityFieldName) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xml, "text/xml");
                const entityNode = xmlDoc.getElementsByTagName("entity")[0];

                const existingAttribute = Array.from(entityNode.getElementsByTagName("attribute"));
                const attributeExists = existingAttribute.some(attr => attr.getAttribute("name") === localizedEntityFieldName);

                if (!attributeExists) {
                    const attributeNode = xmlDoc.createElement("attribute");
                    attributeNode.setAttribute("name", localizedEntityFieldName);
                    entityNode.appendChild(attributeNode);
                }

                xml = xmlDoc.documentElement.outerHTML;
            }

            this._context.webAPI.retrieveMultipleRecords(view.returnedtypecode, '?fetchXml=' + xml).then(recordResult => {
                this.availableOptions = recordResult.entities.map(r => {
                    let localizedEntityFieldName = "";
                    const mask = this._context.parameters.attributemask.raw;

                    if (mask) {
                        localizedEntityFieldName = mask.replace('{lcid}', this._context.userSettings.languageId.toString());
                    }

                    return {
                        key: r[this.entityIdFieldName],
                        text: (r[localizedEntityFieldName] ? r[localizedEntityFieldName] : r[this.entityNameFieldName]) ?? 'Display Name is not available'
                    };
                });

                this.renderControl(this._context);
                return true;
            }).catch(error => {
                console.error("Error retrieving records:", error);
                throw error;
            });
            return true;
        }).catch(error => {
            console.error("Error retrieving FetchXML query:", error);
            throw error;
        });
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        try {
            if (context.updatedProperties.includes("dependantLookup")) {
                const newParentId = context.parameters.dependantLookup.raw.length > 0 ? context.parameters.dependantLookup.raw[0].id : null;
                if (newParentId !== this.parentId) {
                    this.parentId = newParentId;
                    this.currentValue = undefined;
                    this.notifyOutputChanged();
                    this.retrieveRecords(); // Fetch data in order after condition update
                }
            } else if (context.updatedProperties.includes("lookup")) {
                this.renderControl(context);
            }
        } catch (error) {
            console.error("UpdateView error:", error);
            this.renderFallback();
        }
    }

    private renderControl(context: ComponentFramework.Context<IInputs>) {
    
        let recordId = this._context.parameters.lookup.raw != null && this._context.parameters.lookup.raw.length > 0
            ? this._context.parameters.lookup.raw[0].id
            : '---';
    
        console.debug("Record ID:", recordId);
    
        if (this.newlyCreatedId) {
            recordId = this.newlyCreatedId;
            this.newlyCreatedId = null;
        }
    
        if (context.parameters.sortByName.raw === "1") {
            this.availableOptions = this.availableOptions.sort((n1, n2) => {
                if (n1.text.toLowerCase() > n2.text.toLowerCase()) {
                    return 1;
                }
    
                if (n1.text.toLowerCase() < n2.text.toLowerCase()) {
                    return -1;
                }
    
                return 0;
            });
        }
    
        const searchOptions = this._context.parameters.addSearch.raw === "1" ? [
            { key: 'FilterHeader', text: '-', itemType: DropdownMenuItemType.Header, data: { label: this._context.resources.getString("searchPlaceHolder") } },
            { key: 'divider_filterHeader', text: '-', itemType: DropdownMenuItemType.Divider }
        ] : [];
    
        const options = [...searchOptions, { key: '---', text: '---' }, ...this.availableOptions];
    
        const recordSelector = React.createElement("div", { className: "custom-dropdown" },
            React.createElement(SearchableDropdown, {
                selectedKey: recordId,
                options: options,
                isDisabled: context.mode.isControlDisabled,
                onChange: (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption, index?: number) => {
                    if (typeof option === 'undefined' || option.key === '---') {
                        this.currentValue = undefined;
                        this.notifyOutputChanged();
                    } else {
                        option.selected = true;
                        this.currentValue = [{
                            id: (option.key as string),
                            name: option.text,
                            entityType: this.entityName
                        }];
                        this.notifyOutputChanged();
                    }
                }
            })
        );
    
        if (this.selectedValue != null && this.selectedValue.length > 0) {
            // Add a delay of 2 seconds before setting the selected value
            setTimeout(() => {
                if (this.selectedValue) {
                    this.currentValue = [{
                        id: (this.selectedValue[0].id),
                        name: this.selectedValue[0].name,
                        entityType: this.entityName
                    }];
                    this.selectedValue = undefined; // Clear the selected value after using it
                    this.notifyOutputChanged(); // Notify the framework of the change
                }
            }, 500); // Delay of 500ms (0.5 second)
        }
        
        ReactDom.render(recordSelector, this.container);
    }
    

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
     */
    public getOutputs(): IOutputs {
        return {
            lookup: this.currentValue
        }
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        ReactDom.unmountComponentAtNode(this.container)
    }
}
