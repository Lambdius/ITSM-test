declare namespace Exceptions {
    type ValidationDetail = {
        messages: string[];
        path: string;
    };

    type HttpResponse = {
        message?: string | string[];
    };

    type InvariantViolationProps = {
        message: string;
    };
}
