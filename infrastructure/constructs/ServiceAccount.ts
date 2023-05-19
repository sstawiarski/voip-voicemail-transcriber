import { projectIamMember, serviceAccount } from "@cdktf/provider-google";
import { Construct } from "constructs";
export interface ServiceAccountConfig extends serviceAccount.ServiceAccountConfig {
	project: string;
	roles: string[];
}
export class ServiceAccount extends serviceAccount.ServiceAccount {
	constructor(scope: Construct, name: string, { roles, project, ...config }: ServiceAccountConfig) {
		super(scope, name, config);

		for (const role of roles) {
			new projectIamMember.ProjectIamMember(this, `${role}-iam-member`, {
				project,
				role,
				member: `serviceAccount:${this.email}`
			});
		}
	}
}
