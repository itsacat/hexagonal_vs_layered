class Project {
    // Это можно делать тут или в domain/ProjectService
    public static async onUserSubscribed(subscription) {
        let project = ProjectRepository.getById(subscription.projectId);
        let user = UserRepository.getById(subscription.userId);

        if (user.isOwnerOfProject(project)) {
            project.enable();
            ProjectPepository.save(project);
        }
    }
}
