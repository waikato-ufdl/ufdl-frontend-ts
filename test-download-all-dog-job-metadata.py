if __name__ == '__main__':
    import os

    from requests import HTTPError

    from wai.common.iterate import first

    try:
        # Connect to the server
        print("Creating context")
        from ufdl.pythonclient import UFDLServerContext
        cc = UFDLServerContext(f"http://localhost:{os.environ['UFDL_SERVER_PORT']}", "admin", "admin")

        # List the completed dog jobs
        from ufdl.pythonclient.functional.core.jobs import job, job_output
        completed_dog_job_instances = [
            job_instance
            for job_instance in job.list(cc)
            if job_instance['template']['pk'] in (10, 11)
        ]

        if len(completed_dog_job_instances) == 0:
            print("No dog-jobs to download")
            exit(0)

        import os
        os.makedirs("dog_jobs_metadata", exist_ok=True)

        for completed_dog_job_instance in completed_dog_job_instances:
            job_pk = completed_dog_job_instance['pk']
            job_output = first(completed_dog_job_instance['outputs'], lambda output: output['name'] == "metadata")[1]

            if job_output is None:
                print(f"No metadata output found for dog-job #{job_pk}")
                continue
            else:
                print(f"Metadata output found for dog-job #{job_pk}: pk={job_output['pk']}, name='{job_output['name']}', type={job_output['type']}")

            with open(f"dog_jobs_metadata/dog_job_{job_pk}.metadata.json", "wb") as json_file:
                for chunk in job.get_output(cc, job_pk, job_output['name'], job_output['type']):
                    json_file.write(chunk)


    except HTTPError as e:
        print(f"HTTP Error: {e.detail}")
