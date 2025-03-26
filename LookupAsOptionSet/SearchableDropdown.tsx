import * as React from "react";
import {
    Dropdown,
    IDropdownOption,
    IDropdownProps,
    IDropdownStyleProps,
    IDropdownStyles,
} from "@fluentui/react/lib/Dropdown";
import { Icon } from "@fluentui/react/lib/Icon";
import { SearchBox } from "@fluentui/react/lib/SearchBox";
import { Callout, DirectionalHint } from "@fluentui/react/lib/Callout";

export const SearchableDropdown: React.FunctionComponent<IDropdownProps> = (
    props
) => {
    const [searchText, setSearchText] = React.useState<string>("");
    const [isCalloutVisible, setIsCalloutVisible] = React.useState<boolean>(false);
    const [calloutDirection, setCalloutDirection] = React.useState<DirectionalHint>(
        DirectionalHint.bottomLeftEdge
    );
    const [triggerWidth, setTriggerWidth] = React.useState<number>(0);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLDivElement>(null);
    const dismissFlag = React.useRef<boolean>(false);

    const toggleDropdown = (event: React.MouseEvent) => {
        if (dismissFlag.current) {
            dismissFlag.current = false;
            return;
        }
        setIsCalloutVisible((prev) => !prev);
    };

    const handleDismiss = () => {
        dismissFlag.current = true;
        setIsCalloutVisible(false);
        setTimeout(() => {
            dismissFlag.current = false;
        }, 300);
    };

    React.useEffect(() => {
        if (isCalloutVisible && buttonRef.current) {
            setTriggerWidth(buttonRef.current.offsetWidth);
        }
    }, [isCalloutVisible]);

    const filteredOptions = props.options.filter(
        (option) =>
            option.text.toLowerCase().includes(searchText.toLowerCase()) &&
            ![
                "divider",
                "new",
                "FilterHeader",
                "divider_filterHeader",
                "mru",
                "mru_divider1",
                "mru_divider2",
                "mru_divider3",
                "records_header",
                "favorite",
                "mru_divider4",
                "mru_divider5",
            ].includes(option.key?.toString())
    );

    const searchOption = props.options.find((option) => option.key === "FilterHeader");

    // if (!searchOption) {
    //     // Render built-in Fluent UI Dropdown if neither searchOption nor addNewOption exists
    //     return (
    //         <Dropdown
    //             {...props}
    //             options={props.options}
    //             selectedKey={props.selectedKey}
    //             onChange={props.onChange}
    //             styles={dropdownStyles}
    //             style={{ paddingRight: "7px" }}
    //         />
    //     );
    // }

    return (
        <div ref={dropdownRef} style={{ position: "relative" }}>
            {/* Custom Dropdown Trigger */}
            <div
                ref={buttonRef}
                style={dropdownButtonStyle}
                onClick={toggleDropdown}
            >
                <span>
                    {props.options.find((opt) => opt.key === props.selectedKey)?.text || "Select an option"}
                </span>
                <div style={chevronDownContainerStyle}>
                    <Icon iconName="ChevronDown" />
                </div>
            </div>

            {/* Custom Dropdown using onRenderContainer */}
            {isCalloutVisible && (
                <Callout
                    target={buttonRef.current}
                    isBeakVisible={false}
                    directionalHint={calloutDirection}
                    onDismiss={handleDismiss}
                    setInitialFocus
                    styles={{ calloutMain: { padding: 0, minWidth: triggerWidth } }}
                >
                    {/* Conditionally render Search Box (Fixed at Top) */}
                    {searchOption && (
                        <div style={searchContainerStyle}>
                            <SearchBox
                                placeholder={searchOption?.data?.label}
                                value={searchText}
                                underlined={true}
                                onChange={(ev, newValue) => setSearchText(newValue ?? "")}
                            />
                        </div>
                    )}

                    {/* Options List (Scrollable Middle) */}
                    <div style={optionsContainerStyle}>
                        {filteredOptions.map((option) => (
                            <div
                                key={option.key}
                                style={optionContainerStyle}
                                onClick={(event: React.MouseEvent<HTMLDivElement>) => {
                                    props.onChange?.(
                                        event as unknown as React.FormEvent<HTMLDivElement>,
                                        option
                                    );
                                    setIsCalloutVisible(false);
                                }}
                            >
                                <div style={checkmarkContainerStyle}>
                                    {option.key === props.selectedKey && <Icon iconName="CheckMark" />}
                                </div>
                                <span>{option.text}</span>
                            </div>
                        ))}
                    </div>
                </Callout>
            )}
        </div>
    );
};

// 🔹 Styling
const dropdownButtonStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "5px 14px 5px 12px",
    cursor: "pointer",
};

const searchContainerStyle: React.CSSProperties = {
    padding: "8px",
    borderBottom: "1px solid #ccc",
    backgroundColor: "white",
    position: "sticky",
    top: 0,
    zIndex: 10,
};

const optionsContainerStyle: React.CSSProperties = {
    maxHeight: "200px",
    overflowY: "auto",
    backgroundColor: "white",
};

const optionContainerStyle = {
    display: "flex",
    alignItems: "center",
    padding: "8px",
    cursor: "pointer",
    gap: "8px",
};

const chevronDownContainerStyle = { display: "flex", justifyContent: "center", alignItems: "center" };
const checkmarkContainerStyle = { minWidth: "14px" };
