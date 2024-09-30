import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tab, Tabs, TabTitleText } from '@patternfly/react-core';
import { PipelineRunLabel } from '../../../../consts/pipelinerun';
import { useComponent } from '../../../../hooks/useComponents';
import { useLocalStorage } from '../../../../hooks/useLocalStorage';
import { RouterParams } from '../../../../routes/utils';
import { PipelineRunKind } from '../../../../types';
import PipelineRunsTab from '../../../Activity/PipelineRunsTab';
import CommitsListView from '../../../Commits/CommitsListPage/CommitsListView';
import { DetailsSection } from '../../../DetailsPage';
import { useWorkspaceInfo } from '../../../Workspace/workspace-context';

export const ACTIVITY_SECONDARY_TAB_KEY = 'activity-secondary-tab';

export const ComponentActivityTab: React.FC = () => {
  const params = useParams<RouterParams>();
  const { activityTab, workspaceName, componentName } = params;
  const { namespace } = useWorkspaceInfo();
  const [component] = useComponent(namespace, workspaceName, componentName);
  const applicationName = component.spec.application;
  const [lastSelectedTab, setLocalStorageItem] = useLocalStorage<string>(
    `${component ? `${component.spec.componentName}_` : ''}${ACTIVITY_SECONDARY_TAB_KEY}`,
  );
  const currentTab = activityTab || lastSelectedTab || 'latest-commits';

  const getActivityTabRoute = React.useCallback(
    (tab: string) =>
      `/workspaces/${workspaceName}/applications/${applicationName}/components/${componentName}/activity/${tab}`,
    [applicationName, componentName, workspaceName],
  );

  const navigate = useNavigate();
  const setActiveTab = React.useCallback(
    (newTab: string) => {
      if (currentTab !== newTab) {
        navigate(getActivityTabRoute(newTab));
      }
    },
    [currentTab, getActivityTabRoute, navigate],
  );

  React.useEffect(() => {
    if (activityTab !== lastSelectedTab) {
      setLocalStorageItem(currentTab);
    }
  }, [activityTab, lastSelectedTab, currentTab, setLocalStorageItem]);

  React.useEffect(() => {
    if (!activityTab && lastSelectedTab) {
      navigate(getActivityTabRoute(lastSelectedTab), { replace: true });
    }
  }, [activityTab, getActivityTabRoute, lastSelectedTab, navigate]);

  // We will not include any test pipelines that were run against the snapshot that contained the image.
  // If there is such a test pipeline directly run on the image itself, and not on the snapshot, then we want to include it
  const nonTestSnapShotFilter = (plr: PipelineRunKind) =>
    plr.metadata.labels?.[PipelineRunLabel.PIPELINE_TYPE] !== 'test' ||
    !plr.spec.params?.find((p) => p.name === 'SNAPSHOT');

  return (
    <div>
      <DetailsSection
        title="Activity"
        description="Monitor CI/CD activity for this component. Each item in the list represents a process that was started by a user, generated a snapshot, and released."
      >
        <Tabs
          style={{
            width: 'fit-content',
            marginBottom: 'var(--pf-v5-global--spacer--md)',
          }}
          activeKey={currentTab}
          onSelect={(_, k: string) => {
            setActiveTab(k);
          }}
          data-testid="activities-tabs-id"
          unmountOnExit
        >
          <Tab
            data-testid={`comp__activity__tabItem commits`}
            title={<TabTitleText>Commits</TabTitleText>}
            key="commits"
            eventKey="latest-commits"
            className="activity-tab"
          >
            <CommitsListView
              applicationName={applicationName}
              componentName={component.spec.componentName}
            />
          </Tab>
          <Tab
            data-testid={`comp__activity__tabItem pipelineruns`}
            title={<TabTitleText>Pipeline runs</TabTitleText>}
            key="pipelineruns"
            eventKey="pipelineruns"
            className="activity-tab"
          >
            <PipelineRunsTab
              applicationName={applicationName}
              componentName={component.spec.componentName}
              customFilter={nonTestSnapShotFilter}
            />
          </Tab>
        </Tabs>
      </DetailsSection>
    </div>
  );
};

export default ComponentActivityTab;
