#!/usr/bin/env bash

SOLUTIONS="terraform-aws-scanner terraform-aws-darknet terraform-aws-honeytoken guide-aws-hacking training-essential-aws-devsecops"

for S in $SOLUTIONS
do
	PATH="./contents/solutions/$S.md"

	/bin/cat > "$PATH" <<EOF
---
template: solutions.jade
link: https://github.com/opendevsecops/$S
---
EOF

	/usr/bin/curl "https://raw.githubusercontent.com/opendevsecops/$S/master/README.md" >> "$PATH"
done
