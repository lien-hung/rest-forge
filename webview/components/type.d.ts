export interface IButtonProps {
  children: string | ReactNode;
  buttonType?: "button" | "submit" | "reset" | undefined;
  buttonStatus?: string;
  primary: boolean;
  handleButtonClick?: () => void;
}

export interface IButtonStyledProps {
  primary: boolean;
  type?: string;

}
export interface ICommonChildProps {
  children: ReactNode;
}

export interface ICopyIconProps {
  handleClick: (value: string | undefined) => void;
  value: string | undefined;
}

export interface ISaveIconProps {
  handleClick: (value: string | undefined) => void;
  value: string | undefined;
}

export interface IMenuOptionProps {
  children: ReactElement;
  currentOption: string | null;
  menuOption: string;
  isSeparate?: boolean;
}

export interface IMessageProps {
  children: ReactNode;
  primary?: boolean;
}

export interface IMessageStyledProps {
  primary?: boolean;
}

export interface ISelectWrapperProps {
  children: ReactNode;
  requestMenu?: boolean;
  primary?: boolean;
  secondary?: boolean;
}

export interface ISelectWrapperStyledProps {
  primary?: boolean;
  secondary?: boolean;
  border?: boolean;
}