import {
    ClinicalData,
    ClinicalDataBySampleId,
    ClinicalEvent,
} from 'cbioportal-ts-api-client';

export type ClinicalInformationData = {
    clinicalData: any;
    events: ClinicalEvent[];
    patient?: {
        id: string;
        clinicalData: ClinicalData[];
    };
    samples?: ClinicalDataBySampleId[];
    nodes?: any[]; //PDXNode[],
};
