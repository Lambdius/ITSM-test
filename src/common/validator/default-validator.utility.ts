import {
    ValidateNested,
    ArrayMaxSize,
    ArrayMinSize,
    ArrayUnique,
    IsOptional,
    IsPositive,
    IsNotEmpty,
    ValidateIf,
    IsBoolean,
    IsDefined,
    MaxLength,
    IsObject,
    IsString,
    IsArray,
    IsDate,
    IsEnum,
    IsHash,
    Equals,
    IsUUID,
    IsInt,
    IsUrl,
    Max,
    Min,
} from "class-validator";

export abstract class StandardValidationDecorators {
    public static readonly ValidateNested = ValidateNested;
    public static readonly ArrayMinSize = ArrayMinSize;
    public static readonly ArrayMaxSize = ArrayMaxSize;
    public static readonly IsUniqueArray = ArrayUnique;
    public static readonly ValidateIf = ValidateIf;
    public static readonly IsNotEmpty = IsNotEmpty;
    public static readonly IsOptional = IsOptional;
    public static readonly IsPositive = IsPositive;
    public static readonly IsRequired = IsDefined;
    public static readonly IsBoolean = IsBoolean;
    public static readonly MaxLength = MaxLength;
    public static readonly IsObject = IsObject;
    public static readonly IsString = IsString;
    public static readonly IsArray = IsArray;
    public static readonly IsUUID = IsUUID;
    public static readonly IsDate = IsDate;
    public static readonly IsEnum = IsEnum;
    public static readonly Equals = Equals;
    public static readonly IsHash = IsHash;
    public static readonly IsUrl = IsUrl;
    public static readonly IsInt = IsInt;
    public static readonly Min = Min;
    public static readonly Max = Max;
}
