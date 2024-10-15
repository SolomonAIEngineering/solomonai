"use client";

import { AppsModellingModal } from '@/components/modals/apps/app-modeling-modal';
import { Button } from '@/components/ui/button';
import { IntegrationCategory, IntegrationConfig } from '@midday/app-store/types';
import { useToast } from '@midday/ui/use-toast';
import { Loader2 } from 'lucide-react';
import React, { useState } from 'react';

interface InstallAppButtonProps {
    id: string;
    onInitialize: (callback?: () => void) => void;
    active: boolean;
    category: IntegrationCategory;
    installed: boolean;
    cfg: IntegrationConfig;
}

const InstallAppButton: React.FC<InstallAppButtonProps> = ({
    id,
    onInitialize,
    active,
    category,
    installed,
    cfg
}) => {
    const [isLoading, setLoading] = useState(false);
    const [isModellingDialogOpen, setIsModellingDialogOpen] = useState(false);
    const { toast } = useToast();

    const handleOnInitialize = () => {
        setLoading(true);
        try {
            if (category === IntegrationCategory.Modelling || category === IntegrationCategory.GoalTemplates) {
                onInitialize(() => {
                    setIsModellingDialogOpen(true);
                });
            } else {
                onInitialize(() => {
                    console.log("Non-modelling initialization completed");
                    setLoading(false);
                });
            }
        } catch (error) {
            toast({
                duration: 2500,
                variant: "error",
                title: "There was an error installing the app.",
                description: error instanceof Error ? error.message : String(error),
                draggable: true,
            });
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                variant="outline"
                className="w-full border-primary"
                onClick={handleOnInitialize}
                disabled={!onInitialize || !active || isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Installing...
                    </>
                ) : (
                    'Install'
                )}
            </Button>

            <AppsModellingModal
                isOpen={isModellingDialogOpen}
                onClose={() => {
                    setIsModellingDialogOpen(false);
                    setLoading(false);
                }}
                appType={category as IntegrationCategory.GoalTemplates | IntegrationCategory.Modelling}
                id={id}
                installed={installed}
                cfg={cfg}
            />
        </>
    );
};

export default InstallAppButton;