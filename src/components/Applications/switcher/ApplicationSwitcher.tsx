import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Level, LevelItem } from '@patternfly/react-core';
import { useApplications } from '../../../hooks/useApplications';
import { ApplicationModel, ComponentModel } from '../../../models';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { ButtonWithAccessTooltip } from '../../ButtonWithAccessTooltip';
import { ContextMenuItem, ContextSwitcher } from '../../ContextSwitcher';
import { useWorkspaceInfo } from '../../Workspace/useWorkspaceInfo';

export const ApplicationSwitcher: React.FC<
  React.PropsWithChildren<{ selectedApplication?: string }>
> = ({ selectedApplication }) => {
  const navigate = useNavigate();
  const { namespace, workspace } = useWorkspaceInfo();
  const [canCreateApplication] = useAccessReviewForModel(ApplicationModel, 'create');
  const [canCreateComponent] = useAccessReviewForModel(ComponentModel, 'create');

  const [applications] = useApplications(namespace, workspace);

  const menuItems = React.useMemo(
    () =>
      applications?.map((app) => ({ key: app.metadata.name, name: app.spec.displayName })) || [],
    [applications],
  );

  const selectedItem = menuItems.find((item) => item.key === selectedApplication);

  const onSelect = (item: ContextMenuItem) => {
    selectedItem.key !== item.key && navigate(`/workspaces/${workspace}/applications/${item.key}`);
  };

  return menuItems.length > 1 ? (
    <ContextSwitcher
      resourceType="application"
      menuItems={menuItems}
      selectedItem={selectedItem}
      onSelect={onSelect}
      footer={
        <Level>
          <LevelItem>
            <ButtonWithAccessTooltip
              variant="link"
              component={(props) => <Link {...props} to={`/workspaces/${workspace}/import`} />}
              isInline
              tooltip="You don't have access to create an application"
              isDisabled={!(canCreateApplication && canCreateComponent)}
              analytics={{
                link_name: 'create-application',
                workspace,
              }}
            >
              Create application
            </ButtonWithAccessTooltip>
          </LevelItem>
          <LevelItem>
            <Button
              variant="link"
              component={(props) => (
                <Link {...props} to={`/workspaces/${workspace}/applications`} />
              )}
              isInline
            >
              View applications list
            </Button>
          </LevelItem>
        </Level>
      }
    />
  ) : null;
};
