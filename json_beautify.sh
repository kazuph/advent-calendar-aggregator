#!/bin/bash
cat results.json | jq . > hoge
mv hoge results.json
