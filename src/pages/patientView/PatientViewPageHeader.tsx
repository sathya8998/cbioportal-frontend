import React from 'react';
import { observer } from 'mobx-react-lite';
import PatientHeader from './patientHeader/PatientHeader';
import SampleSummaryList from './sampleHeader/SampleSummaryList';
import TimelineWrapper from './timeline/TimelineWrapper';
import { PatientViewPageStore } from './clinicalInformation/PatientViewPageStore';
import { IGenePanelModal } from './PatientViewPage';
import { getRemoteDataGroupStatus } from 'cbioportal-utils';

interface IPatientPageHeaderProps {
    handlePatientClick: (id: string) => void;
    pageStore: PatientViewPageStore;
    handleSampleClick: (
        id: string,
        e: React.MouseEvent<HTMLAnchorElement>
    ) => void;
    toggleGenePanelModal: (genePanelId?: string | undefined) => void;
    genePanelModal: IGenePanelModal;
}

const PatientViewPageHeader: React.FC<IPatientPageHeaderProps> = observer(
    function(props) {
        const today = new Date();
        const yourReferenceDatePropValue = `${today.getMonth() +
            1}/${today.getDate()}/${today.getFullYear()}`;

        return (
            <div className="patientDataTable">
                <table>
                    <tbody>
                        <tr>
                            <td>Patient:</td>
                            <td>
                                <PatientHeader
                                    handlePatientClick={(id: string) =>
                                        props.handlePatientClick(id)
                                    }
                                    patient={
                                        props.pageStore.patientViewData.result
                                            .patient
                                    }
                                    studyId={props.pageStore.studyId}
                                    darwinUrl={props.pageStore.darwinUrl.result}
                                    sampleManager={
                                        props.pageStore.sampleManager.result
                                    }
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>Samples:</td>
                            <td>
                                <div className="patientSamples">
                                    {getRemoteDataGroupStatus(
                                        props.pageStore.studyMetaData,
                                        props.pageStore
                                            .hasMutationalSignatureData,
                                        props.pageStore
                                            .mutationalSignatureDataGroupByVersion,
                                        props.pageStore.allSamplesForPatient
                                    ) === 'complete' && (
                                        <SampleSummaryList
                                            sampleManager={
                                                props.pageStore.sampleManager
                                                    .result!
                                            }
                                            patientViewPageStore={
                                                props.pageStore
                                            }
                                            handleSampleClick={
                                                props.handleSampleClick
                                            }
                                            toggleGenePanelModal={
                                                props.toggleGenePanelModal
                                            }
                                            genePanelModal={
                                                props.genePanelModal
                                            }
                                            handlePatientClick={
                                                props.handlePatientClick
                                            }
                                        />
                                    )}
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>Timeline:</td>
                            <td>
                                <TimelineWrapper
                                    referenceDate={yourReferenceDatePropValue}
                                    dataStore={
                                        props.pageStore
                                            .patientViewMutationDataStore
                                    }
                                    caseMetaData={{
                                        color: {},
                                        label: {},
                                        index: {},
                                    }}
                                    data={
                                        props.pageStore.patientViewData.result
                                            .events
                                    }
                                    sampleManager={
                                        props.pageStore.sampleManager.result!
                                    }
                                    width={800}
                                    samples={
                                        props.pageStore.allSamplesForPatient
                                    }
                                    mutationProfileId={
                                        props.pageStore.mutationProfileId
                                    }
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
);

export default PatientViewPageHeader;
