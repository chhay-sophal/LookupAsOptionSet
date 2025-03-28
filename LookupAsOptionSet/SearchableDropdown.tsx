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

export const SearchableDropdown: React.FunctionComponent<IDropdownProps> = (props) => {
    const [searchText, setSearchText] = React.useState<string>("");
    const [isCalloutVisible, setIsCalloutVisible] = React.useState<boolean>(false);
    const [calloutDirection, setCalloutDirection] = React.useState<DirectionalHint>(DirectionalHint.bottomLeftEdge);
    const [triggerWidth, setTriggerWidth] = React.useState<number>(0);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLDivElement>(null);

    const toggleDropdown = (event: React.MouseEvent) => {
        setIsCalloutVisible((prevState) => !prevState);
    };

    const handleDismiss = () => {
        setIsCalloutVisible(false);
    };

    React.useEffect(() => {
        if (isCalloutVisible && buttonRef.current) {
            setTriggerWidth(buttonRef.current.offsetWidth);
        }
    }, [isCalloutVisible]);

    const filteredOptions = props.options.filter((option) => {
        return option.text.toLowerCase().includes(searchText.toLowerCase()) && ![
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
        ].includes(option.key?.toString());
    });

    const searchOption = props.options.find((option) => option.key === "FilterHeader");

    return (
        <div ref={dropdownRef} style={{ position: "relative" }}>
            <div 
                ref={buttonRef} 
                style={styles.dropdownButton}
                onMouseDown={(e) => {e.preventDefault(); e.stopPropagation();}}
                onClick={toggleDropdown}
            >
                <span>
                    {props.options.find((opt) => opt.key === props.selectedKey)?.text || "Select an option"}
                </span>
                <div style={styles.chevronDownContainer}>
                    <Icon iconName="ChevronDown" />
                </div>
            </div>

            {isCalloutVisible && (
                <Callout
                    target={buttonRef.current}
                    isBeakVisible={false}
                    directionalHint={calloutDirection}
                    gapSpace={2}
                    onDismiss={handleDismiss}
                    styles={{ calloutMain: { padding: 0, minWidth: triggerWidth } }}
                >
                    {searchOption && (
                        <div style={styles.searchContainer}>
                            <SearchBox
                                placeholder={searchOption?.data?.label}
                                value={searchText}
                                underlined
                                onChange={(ev, newValue) => setSearchText(newValue ?? "")}
                            />
                        </div>
                    )}

                    <div style={styles.optionsContainer}>
                        {filteredOptions.map((option) => (
                            <div
                                key={option.key}
                                style={styles.optionContainer}
                                onClick={(event: React.MouseEvent<HTMLDivElement>) => {
                                    props.onChange?.(event as unknown as React.FormEvent<HTMLDivElement>, option);
                                    setIsCalloutVisible(false);
                                }}
                            >
                                <div style={styles.checkmarkContainer}>
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

const styles = {
    dropdownButton: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "5px 14px 5px 12px",
        cursor: "pointer",
        lineHeight: "1.5",
        wordBreak: "break-word"
    } as React.CSSProperties,
    searchContainer: {
        padding: "5px",
        borderBottom: "1px solid #ccc",
        backgroundColor: "white",
        position: "sticky",
        top: 0,
        zIndex: 10,
    } as React.CSSProperties,
    optionsContainer: {
        maxHeight: "300px",
        overflowY: "auto",
        backgroundColor: "white",
    } as React.CSSProperties,
    optionContainer: {
        display: "flex",
        alignItems: "center",
        padding: "8px",
        cursor: "pointer",
        gap: "8px",
    } as React.CSSProperties,
    chevronDownContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    } as React.CSSProperties,
    checkmarkContainer: {
        minWidth: "14px",
    } as React.CSSProperties,
};