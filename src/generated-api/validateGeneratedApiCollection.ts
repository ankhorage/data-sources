import type {
  DataSourceDiagnostic,
  GeneratedApiDefinition,
  GeneratedApiResourceDefinition,
} from '@ankhorage/contracts/data';

export function validateGeneratedApiCollection(
  definition: GeneratedApiDefinition,
  resource: GeneratedApiResourceDefinition,
): readonly DataSourceDiagnostic[] {
  const diagnostics: DataSourceDiagnostic[] = [];
  const fields = resource.collection.fields;
  const fieldNames = new Set<string>();

  if (fields.length === 0) {
    diagnostics.push(diagnostic(definition, resource, 'Generated API resources require fields.', 'fields'));
  }

  fields.forEach((field, index) => {
    const name = field.name.trim();
    if (!name) {
      diagnostics.push(
        diagnostic(definition, resource, 'Generated API field names must be non-empty.', `fields.${index}.name`),
      );
      return;
    }
    if (fieldNames.has(name)) {
      diagnostics.push(
        diagnostic(definition, resource, `Generated API field '${name}' is duplicated.`, `fields.${index}.name`),
      );
      return;
    }
    fieldNames.add(name);
  });

  const primaryKey = resource.collection.primaryKey;
  if (primaryKey !== undefined && !fields.some((field) => field.name === primaryKey)) {
    diagnostics.push(
      diagnostic(
        definition,
        resource,
        `Primary key '${primaryKey}' does not match a collection field.`,
        'primaryKey',
      ),
    );
  }

  return diagnostics;
}

function diagnostic(
  definition: GeneratedApiDefinition,
  resource: GeneratedApiResourceDefinition,
  message: string,
  path: string,
): DataSourceDiagnostic {
  return {
    code: 'invalid-config',
    dataSourceId: definition.id,
    endpointId: resource.id,
    message,
    path: `resources.${resource.id}.collection.${path}`,
    severity: 'error',
  };
}
