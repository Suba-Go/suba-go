export declare const MESSAGES: Record<string, string>;
export declare const errorMap: (issue: any) => {
    message: string;
};
export declare const errorMessages: {
    invalid_type: string;
    too_small: string;
    too_big: string;
    invalid_format: string;
    not_multiple_of: string;
    unrecognized_keys: string;
    invalid_union: string;
    invalid_key: string;
    invalid_element: string;
    invalid_value: string;
    custom: {
        phone: string;
        rut: string;
        name: string;
        email: string;
        companyName: string;
        password: string;
    };
};
