/**
 * Test suite for CI/CD workflow configuration validation
 * This test ensures our GitHub Actions workflows are properly configured
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

describe('CI/CD Workflow Validation', () => {
  const workflowsDir = path.join(__dirname, '../../.github/workflows');

  test('should have CI workflow file', () => {
    const ciWorkflowPath = path.join(workflowsDir, 'ci.yml');
    expect(fs.existsSync(ciWorkflowPath)).toBe(true);
  });

  test('should have deployment workflow file', () => {
    const deployWorkflowPath = path.join(workflowsDir, 'deploy.yml');
    expect(fs.existsSync(deployWorkflowPath)).toBe(true);
  });

  test('CI workflow should be valid YAML', () => {
    const ciWorkflowPath = path.join(workflowsDir, 'ci.yml');
    const content = fs.readFileSync(ciWorkflowPath, 'utf8');
    expect(() => yaml.load(content)).not.toThrow();
  });

  test('CI workflow should have required jobs', () => {
    const ciWorkflowPath = path.join(workflowsDir, 'ci.yml');
    const content = fs.readFileSync(ciWorkflowPath, 'utf8');
    const workflow = yaml.load(content);

    expect(workflow.jobs).toHaveProperty('backend-test');
    expect(workflow.jobs).toHaveProperty('mobile-test');
    expect(workflow.jobs).toHaveProperty('docker-build');
  });

  test('CI workflow should trigger on correct events', () => {
    const ciWorkflowPath = path.join(workflowsDir, 'ci.yml');
    const content = fs.readFileSync(ciWorkflowPath, 'utf8');
    const workflow = yaml.load(content);

    expect(workflow.on.push.branches).toEqual(['main', 'master', 'develop']);
    expect(workflow.on.pull_request.branches).toEqual(['main', 'master', 'develop']);
  });

  test('deployment workflow should have correct environment', () => {
    const deployWorkflowPath = path.join(workflowsDir, 'deploy.yml');
    const content = fs.readFileSync(deployWorkflowPath, 'utf8');
    const workflow = yaml.load(content);

    expect(workflow.jobs['deploy-backend'].environment).toBe('production');
  });

  test('workflows should use correct Node.js version', () => {
    const ciWorkflowPath = path.join(workflowsDir, 'ci.yml');
    const content = fs.readFileSync(ciWorkflowPath, 'utf8');
    const workflow = yaml.load(content);

    const backendTestSteps = workflow.jobs['backend-test'].steps;
    const setupNodeStep = backendTestSteps.find(step =>
      step.uses && step.uses.includes('actions/setup-node')
    );

    expect(setupNodeStep.with['node-version']).toBe('18');
  });
});