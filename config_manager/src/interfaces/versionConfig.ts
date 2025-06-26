export interface VersionConfig {
    configurationId: string;
    versionNum: number;
    description: string;
    fields: Record<string, any>;
    status: string;
    approvedBy: string;
    approvedDate: string;
    createdBy: string;
    createdDate: string;
}