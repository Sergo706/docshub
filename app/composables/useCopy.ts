export const useCopy = () => {
    const { copy, isSupported } = useClipboard();
    const toast = useToast();

    return (value: string) => {
        if(!isSupported.value) {
            toast.add({
               title: 'Warning',
               description: `Your browser does not support Clipboard actions!`,
               icon: 'lucide:message-square-warning',
               color: 'warning'
            });
            return;
        }

        try {
            void copy(value);
            toast.add({
               title: 'Success',
               description: `Copied to Clipboard`,
               icon: 'lucide:copy-check',
               color: 'success'
            });
        } catch {
            toast.add({
               title: 'Error',
               description: `Uh oh! Something went wrong.`,
               icon: 'lucide:circle-alert',
               color: 'error',
               actions: [{
                icon: 'i-lucide-refresh-cw',
                label: 'Retry',
                color: 'neutral',
                variant: 'outline',
                onClick: (e) => {
                    e.stopPropagation();
                    void copy(value);
                }
                }]
            });
        }
    };
};