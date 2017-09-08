class SubscriptionOnProject {
    @inject('UserRepository')
    private userRepository: UserRepository;

    @inject('ProjectRepository')
    private projectRepository: ProjectRepository;

    @inject('SubscriptionRepository')
    private subscriptionRepository: SubscriptionRepository;

    @inject('Notifier')
    private notifier: Notifier;

    public static async execute(
        userId: number,
        projectId: number,
        amount: number,
        paymentType: PaymentType
    ): string {
        let user = this.userRepository.getById(userId);
        let project = this.projectRepository.getById(projectId);
        let subscription = this.subscriptionRepository.getByProject(project);

        if (subscription) {
            user.restoreSubscription(subscription, amount);
        } else {
            subscription = await user.subscribe(project, amount);
        }
        await this.subscriptionRepository.save(subscription);

        let res = '';
        if (subscription.status == 'waitingForFirstOrder') {
            res = await PaymentOfFirstOrder.execute(subscription, paymentType);
        } else if (subscription.status == 'waitingForRecurrentOrder') {
            await PaymentOfRecurrentOrder.execute(subscription);
        }
        return res;
    }

    public static async undo(userId: number, projectId: number): void {
        // Some undo logic
    }

    public static async onFirstOrderPaid(order, user) {
        let subscription =
            this.subscriptionRepository.getById(order.subscriptionId);
        subscription.enable();
        this.subscriptionRepository.save(subscription);

        this.notifier.notifyAboutFirstPayment(user);
    }

    public static async onRecurrentOrderPaid(order) {
        let subscription =
            this.subscriptionRepository.getById(order.subscriptionId);
        subscription.enable();
        this.subscriptionRepository.save(subscription);
    }

    public static async onUserSubscribed(subscription) {
        let project = this.projectRepository.getById(subscription.projectId);
        let user = this.userRepository.getById(subscription.userId);

        if (user.isOwnerOfProject(project)) {
            project.enable();
            this.projectPepository.save(project);
        }
    }
}
