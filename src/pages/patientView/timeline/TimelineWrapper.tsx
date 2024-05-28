import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react-lite';
import { Sample } from 'cbioportal-ts-api-client';
import PatientViewMutationsDataStore from '../mutation/PatientViewMutationsDataStore';
import 'cbioportal-clinical-timeline/dist/styles.css';
import {
    configureTracks,
    ITimelineConfig,
    Timeline,
    TimelineStore,
    TimelineTrackSpecification,
} from 'cbioportal-clinical-timeline';
import { ClinicalEvent, ClinicalData } from 'cbioportal-ts-api-client';
import SampleManager from 'pages/patientView/SampleManager';
import {
    buildBaseConfig,
    configureGenieTimeline,
    configureHtanOhsuTimeline,
    configureTimelineToxicityColors,
    sortTracks,
} from 'pages/patientView/timeline/timeline_helpers';
import { downloadZippedTracks } from './timelineDataUtils';
import { v4 as uuidv4 } from 'uuid';
import { MobxPromiseUnionTypeWithDefault } from 'mobxpromise/dist/src/MobxPromise';

export interface ISampleMetaData {
    color: { [sampleId: string]: string };
    index: { [sampleId: string]: number };
    label: { [sampleId: string]: string };
}

export interface ITimelineProps {
    dataStore: PatientViewMutationsDataStore;
    data: ClinicalEvent[];
    caseMetaData: ISampleMetaData;
    sampleManager: SampleManager;
    width: number;
    samples: Sample[] | MobxPromiseUnionTypeWithDefault<Sample[]>;
    mutationProfileId: string;
    headerWidth?: number;
    referenceDate?: string; // Added referenceDate property
}

const TimelineWrapper: React.FunctionComponent<ITimelineProps> = observer(
    function({
        data,
        caseMetaData,
        sampleManager,
        width,
        headerWidth = 0,
        referenceDate,
    }: ITimelineProps) {
        const [events, setEvents] = useState<
            TimelineTrackSpecification[] | null
        >(null);
        const [store, setStore] = useState<TimelineStore | null>(null);
        const [dateType, setDateType] = useState<'absolute' | 'relative'>(
            'absolute'
        );

        useEffect(() => {
            const isGenieBpcStudy = window.location.href.includes('genie_bpc');
            const isHtanOhsuPatient =
                window.location.href.includes('htan_test_2021') &&
                window.location.href.includes('HTA9_1');
            const isToxicityPortal = [
                'triage.cbioportal.mskcc.org',
                'cbioportal.mskcc.org',
                'private.cbioportal.mskcc.org',
            ].includes(window.location.hostname);

            const baseConfig: ITimelineConfig = buildBaseConfig(
                sampleManager,
                caseMetaData
            );

            if (isGenieBpcStudy) {
                configureGenieTimeline(baseConfig);
            }

            if (isHtanOhsuPatient) {
                const extraData: ClinicalEvent = {
                    uniquePatientKey: 'SFRBOV8xOmh0YW5fdGVzdF8yMDIx',
                    studyId: 'htan_test_2021',
                    patientId: 'HTA9_1',
                    eventType: 'IMAGING',
                    attributes: [
                        {
                            key: 'linkout',
                            value:
                                'https://minerva-story-htan-ohsu-demo.surge.sh/#s=1&w=1&g=6&m=-1&a=-100_-100#v=0.6178_0.57_0.6129#o=-100_-100_1_1#p=Q',
                        },
                        { key: 'ASSAY_TYPE', value: 'mIHC' },
                        {
                            key: 'FILE_FORMAT',
                            value: 'OME-TIFF',
                        },
                    ],
                    startNumberOfDaysSinceDiagnosis: 25726,
                    endNumberOfDaysSinceDiagnosis: 25726,
                    uniqueSampleKey: uuidv4(), // Generate a unique sample key
                };

                // @ts-ignore
                data.push(extraData);

                configureHtanOhsuTimeline(baseConfig);
            }

            if (isToxicityPortal) {
                configureTimelineToxicityColors(baseConfig);
            }

            const trackSpecifications = sortTracks(baseConfig, data);

            configureTracks(trackSpecifications, baseConfig);

            const store = new TimelineStore(trackSpecifications);

            setStore(store);
        }, []);

        const handleDateTypeToggle = () => {
            const newDateType =
                dateType === 'absolute' ? 'relative' : 'absolute';
            setDateType(newDateType);
        };

        if (store) {
            return (
                <>
                    <div>
                        <div>
                            <div className="date-type-toggle">
                                <button
                                    className="date-type-button"
                                    onClick={handleDateTypeToggle}
                                >
                                    {dateType === 'absolute'
                                        ? 'Switch to Relative Dates'
                                        : 'Switch to Absolute Dates'}
                                </button>
                            </div>
                            <Timeline
                                store={store}
                                width={width}
                                headerWidth={headerWidth}
                                onClickDownload={() =>
                                    downloadZippedTracks(data)
                                }
                                referenceDate={referenceDate || ''} // Use default value if referenceDate is undefined
                            />
                        </div>
                    </div>
                </>
            );
        } else {
            return <div />;
        }
    }
);

export default TimelineWrapper;
