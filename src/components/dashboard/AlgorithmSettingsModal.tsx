// src/components/dashboard/AlgorithmSettingsModal.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { AlgorithmConfiguration } from '../../types/dashboard';

interface AlgorithmSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AlgorithmConfiguration;
  onSave: (config: AlgorithmConfiguration) => void;
  categories: { id: number; name: string; slug: string }[];
}

export const AlgorithmSettingsModal: React.FC<AlgorithmSettingsModalProps> = ({
  open,
  onOpenChange,
  config,
  onSave,
  categories
}) => {
  const [localConfig, setLocalConfig] = useState<AlgorithmConfiguration>(config);

  // Reset local config when modal opens
  React.useEffect(() => {
    if (open) {
      setLocalConfig(config);
    }
  }, [open, config]);

  const updateWeight = (key: keyof typeof localConfig.priorityWeights, value: number) => {
    setLocalConfig(prev => ({
      ...prev,
      priorityWeights: {
        ...prev.priorityWeights,
        [key]: value
      }
    }));
  };

  const updateLimit = (key: keyof typeof localConfig.distributionLimits, value: number) => {
    setLocalConfig(prev => ({
      ...prev,
      distributionLimits: {
        ...prev.distributionLimits,
        [key]: value
      }
    }));
  };

  const updateCategoryEnabled = (categoryId: number, enabled: boolean) => {
    setLocalConfig(prev => {
      const categorySettings = prev.categorySettings || {};
      const currentSettings = categorySettings[categoryId] || {
        enabled: true,
        priority: 3,
        userGroupPercentages: {
          highEngagement: 40,
          mediumEngagement: 40,
          lowEngagement: 20
        }
      };

      return {
        ...prev,
        categorySettings: {
          ...categorySettings,
          [categoryId]: {
            ...currentSettings,
            enabled
          }
        }
      };
    });
  };

  const updateCategoryPriority = (categoryId: number, priority: number) => {
    setLocalConfig(prev => {
      const categorySettings = prev.categorySettings || {};
      const currentSettings = categorySettings[categoryId] || {
        enabled: true,
        priority: 3,
        userGroupPercentages: {
          highEngagement: 40,
          mediumEngagement: 40,
          lowEngagement: 20
        }
      };

      return {
        ...prev,
        categorySettings: {
          ...categorySettings,
          [categoryId]: {
            ...currentSettings,
            priority
          }
        }
      };
    });
  };

  const updateCategoryUserGroup = (
    categoryId: number,
    group: keyof typeof localConfig.categorySettings[number]['userGroupPercentages'],
    value: number
  ) => {
    setLocalConfig(prev => {
      const categorySettings = prev.categorySettings || {};
      const currentSettings = categorySettings[categoryId] || {
        enabled: true,
        priority: 3,
        userGroupPercentages: {
          highEngagement: 40,
          mediumEngagement: 40,
          lowEngagement: 20
        }
      };

      return {
        ...prev,
        categorySettings: {
          ...categorySettings,
          [categoryId]: {
            ...currentSettings,
            userGroupPercentages: {
              ...currentSettings.userGroupPercentages,
              [group]: value
            }
          }
        }
      };
    });
  };

  const handleSave = () => {
    onSave(localConfig);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Job Distribution Algorithm Settings</DialogTitle>
          <DialogDescription>
            Configure how jobs are distributed to users based on various factors.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="weights">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="weights">Priority Weights</TabsTrigger>
            <TabsTrigger value="limits">Distribution Limits</TabsTrigger>
            <TabsTrigger value="categories">Category Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weights">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Skills Match Weight</Label>
                <Slider
                  value={[localConfig.priorityWeights.skills * 100]}
                  onValueChange={(value) => updateWeight('skills', value[0] / 100)}
                  max={100}
                  step={1}
                />
                <div className="text-right text-sm text-gray-500">
                  {(localConfig.priorityWeights.skills * 100).toFixed(0)}%
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Location Weight</Label>
                <Slider
                  value={[localConfig.priorityWeights.location * 100]}
                  onValueChange={(value) => updateWeight('location', value[0] / 100)}
                  max={100}
                  step={1}
                />
                <div className="text-right text-sm text-gray-500">
                  {(localConfig.priorityWeights.location * 100).toFixed(0)}%
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Experience Weight</Label>
                <Slider
                  value={[localConfig.priorityWeights.experience * 100]}
                  onValueChange={(value) => updateWeight('experience', value[0] / 100)}
                  max={100}
                  step={1}
                />
                <div className="text-right text-sm text-gray-500">
                  {(localConfig.priorityWeights.experience * 100).toFixed(0)}%
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>User Engagement Weight</Label>
                <Slider
                  value={[localConfig.priorityWeights.engagement * 100]}
                  onValueChange={(value) => updateWeight('engagement', value[0] / 100)}
                  max={100}
                  step={1}
                />
                <div className="text-right text-sm text-gray-500">
                  {(localConfig.priorityWeights.engagement * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="limits">
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxJobsPerUser">Max Jobs Per User</Label>
                  <Input
                    id="maxJobsPerUser"
                    type="number"
                    min={1}
                    max={50}
                    value={localConfig.distributionLimits.maxJobsPerUser}
                    onChange={(e) => updateLimit('maxJobsPerUser', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">
                    Maximum number of jobs to distribute to a single user
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxUsersPerJob">Max Users Per Job</Label>
                  <Input
                    id="maxUsersPerJob"
                    type="number"
                    min={1}
                    max={1000}
                    value={localConfig.distributionLimits.maxUsersPerJob}
                    onChange={(e) => updateLimit('maxUsersPerJob', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">
                    Maximum number of users to distribute a job to
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cooldownPeriod">Cooldown Period (hours)</Label>
                  <Input
                    id="cooldownPeriod"
                    type="number"
                    min={1}
                    max={72}
                    value={localConfig.distributionLimits.cooldownPeriod}
                    onChange={(e) => updateLimit('cooldownPeriod', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">
                    Hours to wait before distributing similar jobs to the same user
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="categories">
            <div className="space-y-4 py-4">
              <div className="max-h-[400px] overflow-y-auto pr-2">
                {categories.map((category) => {
                  const settings = localConfig.categorySettings[category.id] || {
                    enabled: true,
                    priority: 3,
                    userGroupPercentages: {
                      highEngagement: 40,
                      mediumEngagement: 40,
                      lowEngagement: 20
                    }
                  };
                  
                  return (
                    <div key={category.id} className="border rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">{category.name}</h3>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`category-${category.id}-enabled`}>Enabled</Label>
                          <Switch
                            id={`category-${category.id}-enabled`}
                            checked={settings.enabled}
                            onCheckedChange={(checked) => updateCategoryEnabled(category.id, checked)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Priority Level (1-5)</Label>
                          <Slider
                            value={[settings.priority]}
                            onValueChange={(value) => updateCategoryPriority(category.id, value[0])}
                            min={1}
                            max={5}
                            step={1}
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Lowest</span>
                            <span>Highest</span>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="mb-2 block">User Group Distribution</Label>
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>High Engagement Users</span>
                                <span>{settings.userGroupPercentages.highEngagement}%</span>
                              </div>
                              <Slider
                                value={[settings.userGroupPercentages.highEngagement]}
                                onValueChange={(value) => updateCategoryUserGroup(category.id, 'highEngagement', value[0])}
                                min={0}
                                max={100}
                                step={5}
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Medium Engagement Users</span>
                                <span>{settings.userGroupPercentages.mediumEngagement}%</span>
                              </div>
                              <Slider
                                value={[settings.userGroupPercentages.mediumEngagement]}
                                onValueChange={(value) => updateCategoryUserGroup(category.id, 'mediumEngagement', value[0])}
                                min={0}
                                max={100}
                                step={5}
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Low Engagement Users</span>
                                <span>{settings.userGroupPercentages.lowEngagement}%</span>
                              </div>
                              <Slider
                                value={[settings.userGroupPercentages.lowEngagement]}
                                onValueChange={(value) => updateCategoryUserGroup(category.id, 'lowEngagement', value[0])}
                                min={0}
                                max={100}
                                step={5}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
