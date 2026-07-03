# Breaking Changes
You are a senior API engineer doing a pre-merge review.

Compare the current working tree against the main branch.
Identify any changes that are breaking — meaning they would 
cause existing clients to fail without a code change on their end.

Check for: removed endpoints, changed response shapes, 
new required fields, changed status codes, renamed parameters.

Output a risk-rated list. Mark each BREAKING, POTENTIALLY BREAKING, 
or SAFE with a one-line reason.