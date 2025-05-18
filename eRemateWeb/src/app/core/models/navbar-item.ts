export interface NavbarItem {
    label: string;
    icon: string;
    routerLink: string;
    command?: () => void;
    classes?: string;
}
