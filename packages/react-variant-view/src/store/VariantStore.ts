import { remoteData } from 'cbioportal-frontend-commons';
import { GenomeNexusAPI, VariantAnnotation } from 'genome-nexus-ts-api-client';
import _ from 'lodash';
import { computed, observable, makeObservable } from 'mobx';
import MobxPromise from 'mobxpromise';
import {
    CuratedGene,
    IndicatorQueryResp,
    OncoKbAPI,
} from 'oncokb-ts-api-client';
import {
    DataFilterType,
    initDefaultMutationMapperStore,
    MutationMapperDataFetcher,
} from 'react-mutation-mapper';
import { getTranscriptConsequenceSummary } from '../util/AnnotationSummaryUtil';
import {
    DEFAULT_GENOME_NEXUS_DOMAIN,
    DEFAULT_ONCOKB_DOMAIN,
    getGenomeNexusClient,
    getOncokbClient,
} from '../util/ApiClientUtils';
import { ANNOTATION_QUERY_FIELDS } from '../util/Constants';
import { variantToMutation } from '../util/VariantUtil';

export interface IVariantStoreConfig {
    variant: string;
}
export class VariantStore {
    public query: any;
    public genomeNexusClient: GenomeNexusAPI;
    public oncokbClient: OncoKbAPI;
    public mutationMapperDataFetcher: MutationMapperDataFetcher | undefined;

    @observable public variant: string = '';
    @observable public selectedTranscript: string = '';
    @observable public isoformOverrideSource: string = 'mskcc';

    public readonly annotation = remoteData<VariantAnnotation>({
        invoke: async () => {
            return await this.genomeNexusClient.fetchVariantAnnotationGET({
                variant: this.variant,
                // this is a workaround to ignore the incorrect type definition generated by the swagger client generator
                // "fields" is a list of predefined string values, but the type generator incorrectly defines it as a single value
                fields: ANNOTATION_QUERY_FIELDS as any,
                isoformOverrideSource: this.isoformOverrideSource,
            });
        },
        onError: (err: Error) => {},
    });

    public readonly oncokbData: MobxPromise<IndicatorQueryResp> = remoteData({
        invoke: async () => {
            return await this.oncokbClient.annotateMutationsByHGVSgGetUsingGET_1(
                {
                    hgvsg: this.variant,
                }
            );
        },
        onError: () => {},
    });

    public readonly oncokbGenes = remoteData<CuratedGene[]>({
        await: () => [],
        invoke: async () => {
            return this.oncokbClient.utilsAllCuratedGenesGetUsingGET_1({
                includeEvidence: false,
            });
        },
        default: [],
    });

    public readonly oncokbGenesMap = remoteData<{
        [hugoSymbol: string]: CuratedGene;
    }>({
        await: () => [this.oncokbGenes],
        invoke: async () => {
            return Promise.resolve(
                _.keyBy(this.oncokbGenes.result, gene => gene.hugoSymbol)
            );
        },
        default: {},
    });

    public readonly isAnnotatedSuccessfully = remoteData<boolean>({
        await: () => [this.annotation],
        invoke: () => {
            // TODO use successfully_annotated instead of checking genomicLocation
            return Promise.resolve(
                this.annotation.result &&
                    this.annotation.result.annotation_summary.genomicLocation
                        .chromosome &&
                    this.annotation.result.annotation_summary.genomicLocation
                        .start &&
                    this.annotation.result.annotation_summary.genomicLocation
                        .end &&
                    this.annotation.result.annotation_summary.genomicLocation
                        .referenceAllele &&
                    this.annotation.result.annotation_summary.genomicLocation
                        .variantAllele
                    ? true
                    : false
            );
        },
    });

    @computed
    get mutationMapperStore() {
        const mutation = variantToMutation(this.annotationSummary);
        if (
            mutation[0] &&
            mutation[0].gene &&
            mutation[0].gene.hugoGeneSymbol.length !== 0
        ) {
            return initDefaultMutationMapperStore({
                dataFetcher: this.mutationMapperDataFetcher,
                genomeNexusUrl: DEFAULT_GENOME_NEXUS_DOMAIN,
                oncoKbUrl: DEFAULT_ONCOKB_DOMAIN,
                data: mutation,
                hugoSymbol: getTranscriptConsequenceSummary(
                    this.annotationSummary
                ).hugoGeneSymbol,
                // select the lollipop by default
                selectionFilters: [
                    {
                        type: DataFilterType.POSITION,
                        values: [mutation[0].proteinPosStart],
                    },
                ],
            });
        }
        return undefined;
    }

    constructor(
        public variantId: string,
        public queryString: string,
        genomeNexusClient?: GenomeNexusAPI,
        oncoKbClient?: OncoKbAPI,
        mutationMapperDataFetcher?: MutationMapperDataFetcher
    ) {
        makeObservable(this);
        this.variant = variantId;
        this.genomeNexusClient = genomeNexusClient || getGenomeNexusClient();
        this.oncokbClient = oncoKbClient || getOncokbClient();
        this.mutationMapperDataFetcher = mutationMapperDataFetcher;
    }

    @computed
    get annotationSummary() {
        return this.annotation.result
            ? this.annotation.result.annotation_summary
            : undefined;
    }
}
